const {remote, shell} = require('electron')
const {Menu, MenuItem} = remote
const {dialog} = require('electron').remote
const path = require('path')
const csvsync = require('csvsync')
const fs = require('fs')
const os = require("os");
const $ = require('jQuery')
const {app} = require('electron').remote;
const appRootDir = require('app-root-dir').get() //get the path of the application bundle
const ffmpeg = appRootDir+'/ffmpeg/ffmpeg'
const exec = require( 'child_process' ).exec
const si = require('systeminformation');
const naturalSort = require('node-natural-sort')
const mkdirp = require('mkdirp');
var ipcRenderer = require('electron').ipcRenderer;
var moment = require('moment')
var content = document.getElementById("contentDiv")
var localMediaStream
var sys = {
  modelID: 'unknown',
  isMacBook: false // need to detect if macbook for ffmpeg recording framerate value
}
//var instructions = "I'm going to ask you to name some pictures. When you hear a beep, a picture will appear on the computer screen. Your job is to name the picture using only one word. We'll practice several pictures before we begin"
var palpa1Instructions = ["<h1>This task uses nonwords. Nonwords are not real words, <br>" +
                    "but they sound as if they could be. I'm going to say two nonwords to you. <br>" +
                    "Listen carefully: 'zog-zog'. I said the same thing twice. <br>" +
                    "Listen again: 'zog-zeg'. This time they sounded different. <br>" +
                    "That's what this task is all about. <br>" +
                    "Press the <span style='color:green'>GREEN</span> button if they sound the same. <br>" +
                    "Press <span style='color:red'>RED</span> if they are different. </h1>"]
var palpa2Instructions = ["<h1>I'm going to say two words to you. <br>" +
                    "Listen carefully: 'house-house'. I said the same thing twice. <br>" +
                    "Listen again: 'house-mouse'. This time they sounded different. <br>" +
                    "That's what this task is all about. <br>" +
                    "Press the <span style='color:green'>GREEN</span> button if they sound the same. <br>" +
                    "Press <span style='color:red'>RED</span> if they are different. </h1>"]
var palpa8Instructions = ["<h1>You will hear some words. They are not real words, <br>" +
                    "but sound like they could be. <br>" +
                    "Please repeat each word after you hear it. </h1>"]
var palpa14Instructions = ["<h1>This is a silent task. You will see two pictures appear on the screen. <br>" +
                    "Think of their names but don't say them. <br>" +
                    "Your job is to judge whether their names rhyme or not. <br>" +
                    "Press <span style='color:green'>GREEN</span> if their names rhyme, and <br>" +
                    "press <span style='color:red'>RED</span> if their names do not rhyme.<br>" +
                    "Let's try a few for practice.</h1>"]
var palpa15Instructions = ["<h1>I'm going to say two words 'king-sing'. <br>" +
                    "They rhyme. The words sound the same at the end. <br>" +
                    "What about these two: 'rope-wall'. They don't rhyme. <br>" +
                    "What you have to do is choose if the words rhyme or not. <br>" +
                    "If they rhyme, press the <span style='color:green'>GREEN</span> button, if not, press the <span style='color:red'>RED</span> button. <br>" +
                    "Extra practice: 'beard-heard', 'soup-loop', 'leaf-sheaf' </h1>"]
var palpa16Instructions = ["<h1>I'm going to play some words for you. <br>" +
                    "Some are real words, some are made-up words. <br>" +
                    "Say the words after me. Listen for the FIRST sound in the word. <br>" +
                    "Use the keyboard to choose the letter that matches the FIRST sound. <br>" +
                    "Press Left Arrow to repeat a trial. </h1>"]
var palpa17Instructions = ["<h1>I'm going to play some words for you. <br>" +
                    "Some are real words, some are made-up words. <br>" +
                    "Say the words after me. Listen for the LAST sound in the word. <br>" +
                    "Use the keyboard to choose the letter that matches the LAST sound. <br>" +
                    "Press Left Arrow to repeat a trial. </h1>"]
var beepSound = path.join(__dirname, 'assets', 'beep.wav')
var exp = new experiment('Phonological-assessment')
// construct a new ffmpeg recording object
var rec = new ff()
var palpa1TimeoutID
var palpa2TimeoutID
var palpa8TimeoutID
var palpa14TimeoutID
var palpa15TimeoutID
var palpa16TimeoutID
var palpa17TimeoutID
var palpa1TimeoutTime = 1000*60 // 30 seconds
var palpa2TimeoutTime = 1000*60 // 30 seconds
var palpa8TimeoutTime = 1000*60 // 30 seconds
var palpa14TimeoutTime = 1000*60 // 30 seconds
var palpa15TimeoutTime = 1000*60 // 30 seconds
var palpa16TimeoutTime = 1000*60 // 30 seconds
var palpa17TimeoutTime = 1000*60 // 30 seconds
var imgTimeoutID
var itiTimeOutID
var imgDurationMS = 1000*2 // 2 seconds
exp.getRootPath()
exp.getMediaPath()
var palpa1MediaPath = path.resolve(exp.mediapath, 'palpa1', 'media')
var palpa2MediaPath = path.resolve(exp.mediapath, 'palpa2', 'media')
var palpa8MediaPath = path.resolve(exp.mediapath, 'palpa8', 'media')
var palpa14MediaPath = path.resolve(exp.mediapath, 'palpa14', 'media')
var palpa15MediaPath = path.resolve(exp.mediapath, 'palpa15', 'media')
var palpa16MediaPath = path.resolve(exp.mediapath, 'palpa16', 'media')
var palpa17MediaPath = path.resolve(exp.mediapath, 'palpa17', 'media')
var palpa1StimList = fs.readdirSync(palpa1MediaPath).sort(naturalSort())
var palpa2StimList = fs.readdirSync(palpa2MediaPath).sort(naturalSort())
var palpa8StimList = fs.readdirSync(palpa8MediaPath).sort(naturalSort())
var palpa14StimList = fs.readdirSync(palpa14MediaPath).sort(naturalSort())
var palpa15StimList = fs.readdirSync(palpa15MediaPath).sort(naturalSort())
var palpa16StimList = fs.readdirSync(palpa16MediaPath).sort(naturalSort())
var palpa17StimList = fs.readdirSync(palpa17MediaPath).sort(naturalSort())
var palpa1Trials = readCSV(path.resolve(exp.mediapath, 'palpa1', 'palpa1stim.csv'))
var palpa2Trials = readCSV(path.resolve(exp.mediapath, 'palpa2', 'palpa2stim.csv'))
var palpa8Trials = readCSV(path.resolve(exp.mediapath, 'palpa8', 'palpa8stim.csv'))
var palpa14Trials = readCSV(path.resolve(exp.mediapath, 'palpa14', 'palpa14stim.csv'))
var palpa15Trials = readCSV(path.resolve(exp.mediapath, 'palpa15', 'palpa15stim.csv'))
var palpa16Trials = readCSV(path.resolve(exp.mediapath, 'palpa16', 'palpa16stim.csv'))
var palpa17Trials = readCSV(path.resolve(exp.mediapath, 'palpa17', 'palpa17stim.csv'))
var maxNumberOfPalpa1Trials = palpa1Trials.length
var maxNumberOfPalpa2Trials = palpa2Trials.length
var maxNumberOfPalpa8Trials = palpa8Trials.length
var maxNumberOfPalpa14Trials = palpa14Trials.length
var maxNumberOfPalpa15Trials = palpa15Trials.length
var maxNumberOfPalpa16Trials = palpa16Trials.length
var maxNumberOfPalpa17Trials = palpa17Trials.length
var palpa1FileToSave
var palpa2FileToSave
var palpa8FileToSave
var palpa14FileToSave
var palpa15FileToSave
var palpa16FileToSave
var palpa17FileToSave
var isPalpa16PracticeTrial
var isPalpa17PracticeTrial
var palpa1DataFileHeader = ['subj', 'session', 'assessment', 'trial', 'diffLoc', 'diffType', 'keyPressed', 'reactionTime', 'accuracy', os.EOL]
var palpa2DataFileHeader = ['subj', 'session', 'assessment', 'trial', 'diffLoc', 'diffType', 'frequency', 'keyPressed', 'reactionTime', 'accuracy', os.EOL]
var palpa14DataFileHeader = ['subj', 'session', 'assessment', 'trial', 'conditionType', 'keyPressed', 'reactionTime', 'accuracy', os.EOL]
var palpa15DataFileHeader = ['subj', 'session', 'assessment', 'trial', 'conditionType', 'keyPressed', 'reactionTime', 'accuracy', os.EOL]
var palpa16DataFileHeader = ['subj', 'session', 'assessment', 'practice', 'trial', 'target', 'wordOrNot', 'keyPressed', 'reactionTime', 'accuracy', 'errorType', os.EOL]
var palpa17DataFileHeader = ['subj', 'session', 'assessment', 'practice', 'trial', 'target', 'wordOrNot', 'keyPressed', 'reactionTime', 'accuracy', 'errorType', os.EOL]
var palpa16ErrorLookupTable = [
  [['','','',''], ['','','','']],
  [['','','',''], ['','','','']],
  [['d','p','b','r'],['v','p','d','c']],
  [['d','m','t','u'],['m','p','d','c']],
  [['l','w','m','f'],['p','m','d','c']],
  [['b','t','d','q'],['v','p','d','c']],
  [['n','r','m','i'],['m','p','d','c']],
  [['w','n','l','u'],['m','p','d','c']],
  [['p','d','t','q'],['v','p','d','c']],
  [['d','p','l','f'],['v','p','d','c']],
  [['p','s','l','t'],['m','p','d','c']],
  [['f','z','s','u'],['v','p','d','c']],
  [['k','d','t','y'],['v','p','d','c']],
  [['d','p','b','r'],['v','p','d','c']],
  [['s','v','f','x'],['v','p','d','c']],
  [['r','n','m','i'],['p','m','d','c']],
  [['p','g','t','q'],['v','p','d','c']],
  [['b','t','m','q'],['v','p','d','c']],
  [['v','s','z','t'],['v','p','d','c']],
  [['c','d','g','f'],['p','v','d','c']],
  [['d','c','t','i'],['m','v','d','c']],
  [['w','n','l','u'],['m','p','d','c']],
  [['s','d','f','x'],['v','m','d','c']],
  [['d','m','t','u'],['m','p','d','c']],
  [['g','t','m','e'],['v','p','d','c']],
  [['m','d','b','u'],['p','m','d','c']],
  [['z','t','c','e'],['v','m','d','c']],
  [['f','z','s','u'],['v','p','d','c']],
  [['p','d','l','q'],['v','p','d','c']],
  [['k','d','t','y'],['v','p','d','c']],
  [['g','t','d','e'],['v','p','d','c']],
  [['b','t','l','q'],['v','p','d','c']],
  [['t','b','p','q'],['v','p','d','c']],
  [['n','r','m','i'],['m','m','d','c']],
  [['w','n','l','u'],['m','p','d','c']],
  [['c','f','w','e'],['m','p','d','c']],
  [['r','n','m','i'],['p','m','d','c']],
  [['t','b','l','q'],['v','p','d','c']],
  [['v','s','h','l'],['v','p','d','c']],
  [['z','f','v','e'],['v','p','d','c']],
  [['b','c','s','q'],['v','p','d','c']],
  [['g','t','d','h'],['v','p','d','c']],
  [['l','n','m','i'],['p','m','d','c']],
  [['d','c','t','i'],['m','v','d','c']],
  [['c','d','h','y'],['v','p','d','c']],
  [['t','b','p','q'],['v','p','d','c']],
  [['m','d','p','u'],['p','m','d','c']]
]
palpa17ErrorLookupTable = [
  [['','','',''], ['','','','']],
  [['','','',''], ['','','','']],
  [['p','m','t','q'],['v','m','d','c']],
  [['d','p','l','f'],['v','p','d','c']],
  [['f','z','s','u'],['v','p','d','c']],
  [['d','m','t','u'],['m','p','d','c']],
  [['l','t','m','q'],['m','v','d','c']],
  [['g','t','d','h'],['v','p','d','c']],
  [['z','t','d','e'],['v','m','d','c']],
  [['d','p','s','f'],['v','p','d','c']],
  [['n','b','d','w'],['p','m','d','c']],
  [['d','c','b','f'],['v','p','d','c']],
  [['t','l','k','b'],['v','m','d','c']],
  [['t','n','p','q'],['v','m','d','c']],
  [['d','s','g','f'],['v','m','d','c']],
  [['t','n','k','q'],['v','m','d','c']],
  [['s','d','t','x'],['v','m','d','c']],
  [['t','g','v','q'],['v','p','d','c']],
  [['v','p','z','r'],['v','m','d','c']],
  [['d','p','g','f'],['v','p','d','c']],
  [['d','l','t','u'],['m','m','d','c']],
  [['v','s','l','r'],['v','p','d','c']],
  [['k','b','v','y'],['v','p','d','c']],
  [['d','n','z','i'],['m','m','d','c']],
  [['t','p','d','h'],['p','p','d','c']],
  [['m','d','b','u'],['p','m','d','c']],
  [['v','s','d','r'],['v','p','d','c']],
  [['b','d','l','y'],['p','p','d','c']],
  [['d','s','m','r'],['v','m','d','c']],
  [['m','d','n','q'],['m','p','d','c']],
  [['d','p','v','r'],['v','p','d','c']],
  [['d','l','p','u'],['m','m','d','c']],
  [['t','b','k','q'],['v','p','d','c']],
  [['t','b','k','q'],['v','p','d','c']],
  [['s','d','t','x'],['v','m','d','c']],
  [['z','f','d','e'],['v','p','d','c']],
  [['d','n','t','i'],['m','m','d','c']],
  [['t','n','k','q'],['v','m','d','c']],
  [['t','f','d','e'],['m','p','d','c']],
  [['p','d','t','q'],['v','p','d','c']],
  [['n','b','t','w'],['p','m','d','c']],
  [['g','t','d','h'],['v','p','d','c']],
  [['m','l','k','u'],['p','m','d','c']],
  [['d','m','t','u'],['m','p','d','c']],
  [['m','d','k','h'],['p','m','d','c']],
  [['f','z','k','u'],['v','p','d','c']],
  [['t','n','k','q'],['v','m','d','c']]
]
var assessment = ''
var subjID
var sessID
var stimOnset
var accuracy
var rt
//var trialNum = document.getElementById("trialNumID")
//var trialNumber = 1
var t = -1
var tReal = t-1
lowLag.init({'force':'audioTag'}); // init audio functions
var userDataPath = path.join(app.getPath('userData'),'Data')
makeSureUserDataFolderIsThere()
var savePath


function checkForUpdateFromRender() {
  ipcRenderer.send('user-requests-update')
  //alert('checked for update')
}

ipcRenderer.on('showSpinner', function () {
  //<div class="loader">Loading...</div>
  spinnerDiv = document.createElement('div')
  spinnerDiv.className = 'loader'
  spinnerDiv.style.zIndex = "1000";
  content.appendChild(spinnerDiv)
  console.log("added spinner!")

})



function getSubjID() {
  var subjID = document.getElementById("subjID").value.trim()
  if (subjID === '') {
    subjID = '0'
  }
  return subjID
}

function getSessID() {
  var sessID = document.getElementById("sessID").value.trim()
  if (sessID === '') {
    sessID = '0'
  }
  return sessID
}

//camera preview on
function startWebCamPreview() {
  clearScreen()
  var vidPrevEl = document.createElement("video")
  vidPrevEl.autoplay = true
  vidPrevEl.id = "webcampreview"
  content.appendChild(vidPrevEl)
  navigator.webkitGetUserMedia({video: true, audio: false},
    function(stream) {
      localMediaStream = stream
      vidPrevEl.src = URL.createObjectURL(stream)
    },
    function() {
      alert('Could not connect to webcam')
    }
  )
}


// camera preview off
function stopWebCamPreview () {
  if(typeof localMediaStream !== "undefined")
  {
    localMediaStream.getVideoTracks()[0].stop()
    clearScreen()
  }
}


// get date and time for appending to filenames
function getDateStamp() {
  ts = moment().format('MMMM Do YYYY, h:mm:ss a')
  ts = ts.replace(/ /g, '-') // replace spaces with dash
  ts = ts.replace(/,/g, '') // replace comma with nothing
  ts = ts.replace(/:/g, '-') // replace colon with dash
  console.log('recording date stamp: ', ts)
  return ts
}


// runs when called by systeminformation
function updateSys(ID) {
  sys.modelID = ID
  if (ID.includes("MacBook") == true) {
    sys.isMacBook = true
  }

  //console.log("updateSys has updated!")
  //console.log(ID.includes("MacBook"))
  //console.log(sys.isMacBook)
} // end updateSys

si.system(function(data) {
  console.log(data['model']);
  updateSys(data['model'])
})


// ffmpeg object constructor
function ff() {
  this.ffmpegPath = path.join(appRootDir,'ffmpeg','ffmpeg'),
  this.framerate = function () {

  },
  this.shouldOverwrite = '-y',         // do overwrite if file with same name exists
  this.threadQueSize = '512',           // preallocation
  this.cameraFormat = 'avfoundation',  // macOS only
  this.screenFormat = 'avfoundation',  // macOS only
  this.cameraDeviceID = '0',           // macOS only
  this.audioDeviceID = '0',            // macOS only
  this.screenDeviceID = '1',           // macOS only

  // ffmpeg 4.1 options:
  // see "man ffpeg" for more information
  // static ffmpeg builds: https://ffmpeg.zeranoe.com/builds/
  this.videoSize = '640x400',          // output video dimensions
  this.videoCodec = 'libx264',         // man ffmpeg for option -vcodec
  this.recQuality = '356k',            // man ffmpeg for option -b 
  this.audioQuality = '64k',           // man ffmpeg for option -aq
  this.audioVolume = '1.0',            
  // note: required for libx264
  // https://superuser.com/questions/820134/why-cant-quicktime-play-a-movie-file-encoded-by-ffmpeg
  this.pixelFormat = 'yuv420p',        // bits per pixel 12

  this.videoExt = '.mp4',
  this.isRecording = false,
  this.getSubjID = function() {
    var subjID = document.getElementById("subjID").value.trim()
    if (subjID === '') {
      console.log ('subject is blank')
      alert('Participant field is blank!')
      subjID = '0000'
    }
    return subjID
  },
  this.getSessID = function () {
    var sessID = document.getElementById("sessID").value.trim()
    if (sessID === '') {
      console.log ('session is blank')
      alert('Session field is blank!')
      sessID = '0000'
    }
    return sessID
  },
  this.getAssessmentType = function () {
    var assessmentType = document.getElementById("assessmentID").value.trim()
    if (assessmentType === '') {
      console.log ('assessment field is blank')
      alert('Assessment field is blank!')
    } else {
      return assessmentType
    }
  },
  this.datestamp = getDateStamp(),
  this.makeOutputFolder = function () {
    outpath = path.join(savePath, this.getAssessmentType(), getSubjID(), getSessID())
    if (!fs.existsSync(outpath)) {
      mkdirp.sync(outpath)
    }
    return outpath
  }
  this.outputFilename = function() {
    return path.join(this.makeOutputFolder(), this.getSubjID()+'_'+this.getSessID()+'_'+this.getAssessmentType()+'_'+getDateStamp()+this.videoExt)
  },
  this.getFramerate = function () {
    if (sys.isMacBook == true){
      var framerate = 30
    } else {
      var framerate = 29.97
    }
    return framerate
  },
  this.startRec = function() {
    cmd = [
      '"'+this.ffmpegPath +'"' +
      ' ' + this.shouldOverwrite +

      // screen input settings
      ' -thread_queue_size ' + this.threadQueSize +
      ' -f ' + this.screenFormat +
      ' -framerate ' + this.getFramerate().toString() +
      ' -i ' + '"' + this.screenDeviceID + '"' +

      // camera input settings
      ' -thread_queue_size ' + this.threadQueSize +
      ' -f ' + this.cameraFormat +
      ' -framerate ' + this.getFramerate().toString() +
      ' -i "' + this.cameraDeviceID + '":"' + this.audioDeviceID + '"' +

      ' -profile:v baseline' +
      
      // quality settings
      ' -s ' + this.videoSize +
      ' -b:v ' + this.recQuality +
      ' -aq ' + this.audioQuality +
      ' -vcodec ' + this.videoCodec +
      ' -pix_fmt ' + this.pixelFormat +
      ' -filter:a "volume=' + this.audioVolume + '" ' + 

      // ' -filter_complex ' + this.filter +
      ' -r ' + this.getFramerate().toString() +
      // ' -movflags +faststart ' + '"' + this.outputFilename() + '"'
      '  ' + '"' + this.outputFilename() + '"'
    ]
    cmd = cmd.toString()
    console.log('ffmpeg cmd: ')
    console.log(cmd)
    this.isRecording = true
    exec(cmd,{maxBuffer: 2000 * 1024}, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        alert('Recording stopped!')
        return
      }
      // console.log(`stdout: ${stdout}`);
       console.log(`stderr: ${stderr}`);
    })
  },
  this.stopRec = function () {
    exec('killall ffmpeg')
  }
}


// open data folder in finder
function openDataFolder() {
  dataFolder = savePath
  if (!fs.existsSync(dataFolder)) {
    mkdirp.sync(dataFolder)
  }
  shell.showItemInFolder(dataFolder)
}


function makeSureUserDataFolderIsThere() {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath)
  }
}


function chooseFile() {
  console.log("Analyze a file!")
  dialog.showOpenDialog(
    {title: "PALPA Analysis",
    defaultPath: savePath,
    properties: ["openFile"]},
  analyzeSelectedFile)
}


function analyzeSelectedFile(theChosenOne) {
  filePath = theChosenOne[0]
  console.log("file chosen: ", filePath)
  data = readCSV(filePath)
  len = data.length
  if (filePath.search('palpa1_') > -1) {
    console.log('analyzing palpa1')
    scoreSame = 0
    scoreDiff = 0
    scoreInitial = 0
    scoreFinal = 0
    scoreMetathetic = 0
    scoreVoice = 0
    scorePlace = 0
    scoreManner = 0
    for (i = 0; i < len; i++) {
      if (data[i]['diffLoc'] === 's' && Number(data[i]['accuracy']) === 1) {
        // if sounds were the same and accuracy was 1
        scoreSame += 1 // increase score by 1
        console.log('scoreSame: ',scoreSame)
      }
      if (data[i]['diffLoc'] !== 's' && Number(data[i]['accuracy']) === 1) {
        // if sounds were different and accuracy was 1
        scoreDiff += 1
      }
      if (data[i]['diffLoc'] === 'i' && Number(data[i]['accuracy']) === 1) {
        scoreInitial += 1
      }
      if (data[i]['diffLoc'] === 'f' && Number(data[i]['accuracy']) === 1) {
        scoreFinal += 1
      }
      if (data[i]['diffLoc'] === 'm' && Number(data[i]['accuracy']) === 1) {
        scoreMetathetic += 1
      }
      if (data[i]['diffType'] === 'v' && Number(data[i]['accuracy']) === 1) {
        scoreVoice += 1
      }
      if (data[i]['diffType'] === 'p' && Number(data[i]['accuracy']) === 1) {
        scorePlace += 1
      }
      if (data[i]['diffType'] === 'm' && Number(data[i]['accuracy']) === 1) {
        scoreManner += 1
      }
    }
    clearScreen()

    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa1Trials !== len) {
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // same
    var same_p = document.createElement("p")
    var same_txt = document.createTextNode("Score Same: " + scoreSame.toString())
    same_p.appendChild(same_txt)
    textDiv.appendChild(same_p)

    //diff
    var diff_p = document.createElement("p")
    var diff_txt = document.createTextNode("Score Different: " + scoreDiff.toString())
    diff_p.appendChild(diff_txt)
    textDiv.appendChild(diff_p)

    // initial
    var init_p = document.createElement("p")
    var init_txt = document.createTextNode("Score Initial: " + scoreInitial.toString())
    init_p.appendChild(init_txt)
    textDiv.appendChild(init_p)

    // final
    var final_p = document.createElement("p")
    var final_txt = document.createTextNode("Score Final: " + scoreFinal.toString())
    final_p.appendChild(final_txt)
    textDiv.appendChild(final_p)

    // metathetic
    var meta_p = document.createElement("p")
    var meta_txt = document.createTextNode("Score Metathetic: " + scoreMetathetic.toString())
    meta_p.appendChild(meta_txt)
    textDiv.appendChild(meta_p)

    // voice
    var voice_p = document.createElement("p")
    var voice_txt = document.createTextNode("Score Voice: " + scoreVoice.toString())
    voice_p.appendChild(voice_txt)
    textDiv.appendChild(voice_p)

    // place
    var place_p = document.createElement("p")
    var place_txt = document.createTextNode("Score Place: " + scorePlace.toString())
    place_p.appendChild(place_txt)
    textDiv.appendChild(place_p)

    // manner
    var manner_p = document.createElement("p")
    var manner_txt = document.createTextNode("Score Manner: " + scoreManner.toString())
    manner_p.appendChild(manner_txt)
    textDiv.appendChild(manner_p)
    content.appendChild(textDiv)

  } else if (filePath.search('palpa2_') > -1) {
    console.log('analyzing palpa2')
    scoreSame = 0
    scoreDiff = 0
    scoreInitial = 0
    scoreFinal = 0
    scoreMetathetic = 0
    scoreVoice = 0
    scorePlace = 0
    scoreManner = 0
    scoreHigh = 0
    scoreLow = 0
    for (i = 0; i < len; i++) {
      if (data[i]['diffLoc'] === 's' && Number(data[i]['accuracy']) === 1) {
        // if sounds were the same and accuracy was 1
        scoreSame += 1 // increase score by 1
        console.log('scoreSame: ',scoreSame)
      }
      if (data[i]['diffLoc'] !== 's' && Number(data[i]['accuracy']) === 1) {
        // if sounds were different and accuracy was 1
        scoreDiff += 1
      }
      if (data[i]['diffLoc'] === 'i' && Number(data[i]['accuracy']) === 1) {
        scoreInitial += 1
      }
      if (data[i]['diffLoc'] === 'f' && Number(data[i]['accuracy']) === 1) {
        scoreFinal += 1
      }
      if (data[i]['diffLoc'] === 'm' && Number(data[i]['accuracy']) === 1) {
        scoreMetathetic += 1
      }
      if (data[i]['diffType'] === 'v' && Number(data[i]['accuracy']) === 1) {
        scoreVoice += 1
      }
      if (data[i]['diffType'] === 'p' && Number(data[i]['accuracy']) === 1) {
        scorePlace += 1
      }
      if (data[i]['diffType'] === 'm' && Number(data[i]['accuracy']) === 1) {
        scoreManner += 1
      }
      if (data[i]['frequency'] === 'h' && Number(data[i]['accuracy']) === 1) {
        scoreHigh += 1
      }
      if (data[i]['frequency'] === 'l' && Number(data[i]['accuracy']) === 1) {
        scoreLow += 1
      }
    }
    clearScreen()
    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa2Trials !== len) {
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // same
    var same_p = document.createElement("p")
    var same_txt = document.createTextNode("Score Same: " + scoreSame.toString())
    same_p.appendChild(same_txt)
    textDiv.appendChild(same_p)

    //diff
    var diff_p = document.createElement("p")
    var diff_txt = document.createTextNode("Score Different: " + scoreDiff.toString())
    diff_p.appendChild(diff_txt)
    textDiv.appendChild(diff_p)

    // initial
    var init_p = document.createElement("p")
    var init_txt = document.createTextNode("Score Initial: " + scoreInitial.toString())
    init_p.appendChild(init_txt)
    textDiv.appendChild(init_p)

    // final
    var final_p = document.createElement("p")
    var final_txt = document.createTextNode("Score Final: " + scoreFinal.toString())
    final_p.appendChild(final_txt)
    textDiv.appendChild(final_p)

    // metathetic
    var meta_p = document.createElement("p")
    var meta_txt = document.createTextNode("Score Metathetic: " + scoreMetathetic.toString())
    meta_p.appendChild(meta_txt)
    textDiv.appendChild(meta_p)

    // voice
    var voice_p = document.createElement("p")
    var voice_txt = document.createTextNode("Score Voice: " + scoreVoice.toString())
    voice_p.appendChild(voice_txt)
    textDiv.appendChild(voice_p)

    // place
    var place_p = document.createElement("p")
    var place_txt = document.createTextNode("Score Place: " + scorePlace.toString())
    place_p.appendChild(place_txt)
    textDiv.appendChild(place_p)

    // manner
    var manner_p = document.createElement("p")
    var manner_txt = document.createTextNode("Score Manner: " + scoreManner.toString())
    manner_p.appendChild(manner_txt)
    textDiv.appendChild(manner_p)

    // low freq
    var low_p = document.createElement("p")
    var low_txt = document.createTextNode("Score Low Freq: " + scoreLow.toString())
    low_p.appendChild(low_txt)
    textDiv.appendChild(low_p)

    // high freq
    var high_p = document.createElement("p")
    var high_txt = document.createTextNode("Score High Freq: " + scoreHigh.toString())
    high_p.appendChild(high_txt)
    textDiv.appendChild(high_p)

    content.appendChild(textDiv)

  } else if (filePath.search('palpa14_') > -1) {
    console.log('analyzing palpa14')
    scoreSS = 0
    scoreDS = 0
    scoreNR = 0
    for (i = 0; i < len; i++) {
      if (data[i]['conditionType'] === 'SS' && Number(data[i]['accuracy']) === 1) {
        scoreSS += 1
      }
      if (data[i]['conditionType'] === 'DS' && Number(data[i]['accuracy']) === 1) {
        scoreDS += 1
      }
      if (data[i]['conditionType'] === 'NR' && Number(data[i]['accuracy']) === 1) {
        scoreNR += 1
      }
    }
    clearScreen()
    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa14Trials !== len) {
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // SS
    var ss_p = document.createElement("p")
    var ss_txt = document.createTextNode("Score SS: " + scoreSS.toString())
    ss_p.appendChild(ss_txt)
    textDiv.appendChild(ss_p)

    // DS
    var ds_p = document.createElement("p")
    var ds_txt = document.createTextNode("Score DS: " + scoreDS.toString())
    ds_p.appendChild(ds_txt)
    textDiv.appendChild(ds_p)

    // NR
    var nr_p = document.createElement("p")
    var nr_txt = document.createTextNode("Score NR: " + scoreNR.toString())
    nr_p.appendChild(nr_txt)
    textDiv.appendChild(nr_p)
    content.appendChild(textDiv)

  } else if (filePath.search('palpa15_') > -1) {
    console.log('analyzing palpa15')
    scoreSPR = 0
    scoreSPC = 0
    scorePR = 0
    scorePC = 0
    maxScore = 15
    for (i = 0; i < len; i++) {
      if (data[i]['conditionType'] === 'spr' && Number(data[i]['accuracy']) === 1) {
        scoreSPR += 1
      }
      if (data[i]['conditionType'] === 'spc' && Number(data[i]['accuracy']) === 1) {
        scoreSPC += 1
      }
      if (data[i]['conditionType'] === 'pr' && Number(data[i]['accuracy']) === 1) {
        scorePR += 1
      }
      if (data[i]['conditionType'] === 'pc' && Number(data[i]['accuracy']) === 1) {
        scorePC += 1
      }
    }
    clearScreen()
    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa15Trials !== len) {
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // SPR
    var spr_p = document.createElement("p")
    var spr_txt = document.createTextNode("Score SPR Correct: " + scoreSPR.toString() + " Error: " + (maxScore-scoreSPR).toString())
    spr_p.appendChild(spr_txt)
    textDiv.appendChild(spr_p)

    // SPC
    var spc_p = document.createElement("p")
    var spc_txt = document.createTextNode("Score SPC Correct: " + scoreSPC.toString()  + " Error: " + (maxScore-scoreSPC).toString())
    spc_p.appendChild(spc_txt)
    textDiv.appendChild(spc_p)

    // PR
    var pr_p = document.createElement("p")
    var pr_txt = document.createTextNode("Score PR Correct: " + scorePR.toString()  + " Error: " + (maxScore-scorePR).toString())
    pr_p.appendChild(pr_txt)
    textDiv.appendChild(pr_p)

    // PC
    var pc_p = document.createElement("p")
    var pc_txt = document.createTextNode("Score PC Correct: " + scorePC.toString()  + " Error: " + (maxScore-scorePC).toString())
    pc_p.appendChild(pc_txt)
    textDiv.appendChild(pc_p)
    content.appendChild(textDiv)

  } else if (filePath.search('palpa16_') > -1) {
    console.log('analyzing palpa16')
    scoreWords = 0
    scoreNonWords = 0
    numErrsVoice = 0
    numErrsPlace = 0
    numErrsManner = 0
    numErrsD = 0
    numErrsVis = 0
    for (i = 0; i < len; i++) {
      if (data[i]['wordOrNot'] === '1' && Number(data[i]['accuracy']) === 1) {
        scoreWords += 1
      }
      if (data[i]['wordOrNot'] === '0' && Number(data[i]['accuracy']) === 1) {
        scoreNonWords += 1
      }
      if (data[i]['errorType'] === 'v' && Number(data[i]['accuracy']) === 0) {
        numErrsVoice += 1
      }
      if (data[i]['errorType'] === 'p' && Number(data[i]['accuracy']) === 0) {
        numErrsPlace += 1
      }
      if (data[i]['errorType'] === 'm' && Number(data[i]['accuracy']) === 0) {
        numErrsManner += 1
      }
      if (data[i]['errorType'] === 'd' && Number(data[i]['accuracy']) === 0) {
        numErrsD += 1
      }
      if (data[i]['errorType'] === 'c' && Number(data[i]['accuracy']) === 0) {
        numErrsVis += 1
      }
    }
    clearScreen()
    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa16Trials-2 !== len) { // -2 to omit practice
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // words
    var words_p = document.createElement("p")
    var words_txt = document.createTextNode("Score Words: " + scoreWords.toString())
    words_p.appendChild(words_txt)
    textDiv.appendChild(words_p)
    // non words
    var nonwords_p = document.createElement("p")
    var nonwords_txt = document.createTextNode("Score Non-words: " + scoreNonWords.toString())
    nonwords_p.appendChild(nonwords_txt)
    textDiv.appendChild(nonwords_p)
    // errs place
    var place_p = document.createElement("p")
    var place_txt = document.createTextNode("Score Place: " + (40-numErrsPlace).toString())
    place_p.appendChild(place_txt)
    textDiv.appendChild(place_p)
    // errs voice
    var voice_p = document.createElement("p")
    var voice_txt = document.createTextNode("Score Voice: " + (30-numErrsVoice).toString())
    voice_p.appendChild(voice_txt)
    textDiv.appendChild(voice_p)
    // errs manner
    var manner_p = document.createElement("p")
    var manner_txt = document.createTextNode("Score Manner: " + (20-numErrsManner).toString())
    manner_p.appendChild(manner_txt)
    textDiv.appendChild(manner_p)
    // errs 2+ distinctive
    var d_p = document.createElement("p")
    var d_txt = document.createTextNode("Score 2+ distinctive features: " + (45-numErrsD).toString())
    d_p.appendChild(d_txt)
    textDiv.appendChild(d_p)
    // errs visual
    var vis_p = document.createElement("p")
    var vis_txt = document.createTextNode("Score Visual: " + (45-numErrsVis).toString())
    vis_p.appendChild(vis_txt)
    textDiv.appendChild(vis_p)

    content.appendChild(textDiv)

  } else if (filePath.search('palpa17_') > -1) {
    console.log('analyzing palpa17')
    scoreWords = 0
    scoreNonWords = 0
    numErrsVoice = 0
    numErrsPlace = 0
    numErrsManner = 0
    numErrsD = 0
    numErrsVis = 0
    for (i = 0; i < len; i++) {
      if (data[i]['wordOrNot'] === '1' && Number(data[i]['accuracy']) === 1) {
        scoreWords += 1
      }
      if (data[i]['wordOrNot'] === '0' && Number(data[i]['accuracy']) === 1) {
        scoreNonWords += 1
      }
      if (data[i]['errorType'] === 'v' && Number(data[i]['accuracy']) === 0) {
        numErrsVoice += 1
      }
      if (data[i]['errorType'] === 'p' && Number(data[i]['accuracy']) === 0) {
        numErrsPlace += 1
      }
      if (data[i]['errorType'] === 'm' && Number(data[i]['accuracy']) === 0) {
        numErrsManner += 1
      }
      if (data[i]['errorType'] === 'd' && Number(data[i]['accuracy']) === 0) {
        numErrsD += 1
      }
      if (data[i]['errorType'] === 'c' && Number(data[i]['accuracy']) === 0) {
        numErrsVis += 1
      }
    }
    clearScreen()
    var textDiv = document.createElement("div")
    textDiv.style.textAlign = 'center'
    if (maxNumberOfPalpa17Trials-2 !== len) { // -2 to omit practice
      var warn_p = document.createElement("p")
      var warn_txt = document.createTextNode("Warning! The number of trials in the data file does not match the total number of trials for this test")
      warn_p.appendChild(warn_txt)
      textDiv.appendChild(warn_p)
    }
    // words
    var words_p = document.createElement("p")
    var words_txt = document.createTextNode("Score Words: " + scoreWords.toString())
    words_p.appendChild(words_txt)
    textDiv.appendChild(words_p)
    // non words
    var nonwords_p = document.createElement("p")
    var nonwords_txt = document.createTextNode("Score Non-words: " + scoreNonWords.toString())
    nonwords_p.appendChild(nonwords_txt)
    textDiv.appendChild(nonwords_p)
    // errs place
    var place_p = document.createElement("p")
    var place_txt = document.createTextNode("Score Place: " + (30-numErrsPlace).toString())
    place_p.appendChild(place_txt)
    textDiv.appendChild(place_p)
    // errs voice
    var voice_p = document.createElement("p")
    var voice_txt = document.createTextNode("Score Voice: " + (30-numErrsVoice).toString())
    voice_p.appendChild(voice_txt)
    textDiv.appendChild(voice_p)
    // errs manner
    var manner_p = document.createElement("p")
    var manner_txt = document.createTextNode("Score Manner: " + (30-numErrsManner).toString())
    manner_p.appendChild(manner_txt)
    textDiv.appendChild(manner_p)
    // errs 2+ distinctive
    var d_p = document.createElement("p")
    var d_txt = document.createTextNode("Score 2+ distinctive features: " + (45-numErrsD).toString())
    d_p.appendChild(d_txt)
    textDiv.appendChild(d_p)
    // errs visual
    var vis_p = document.createElement("p")
    var vis_txt = document.createTextNode("Score Visual: " + (45-numErrsVis).toString())
    vis_p.appendChild(vis_txt)
    textDiv.appendChild(vis_p)

    content.appendChild(textDiv)

  }
}


// play audio file using lowLag API
function playAudio(fileToPlay) {
  lowLag.load(fileToPlay);
  lowLag.play(fileToPlay);
  return getTime()
}


// get timestamp (milliseconds since file loaded)
function getTime() {
  return performance.now()
}


// read csv file. This is how experiments will be controlled, query files to show, etc.
function readCSV(filename){
  var csv = fs.readFileSync(filename)
  var stim = csvsync.parse(csv, {
    skipHeader: false,
    returnObject: true
  })
  //var stim = csvReader(filename)
  console.log(stim)
  return stim
  //stim = readCSV(myfile)
  //console.log(stim)
  //var myfile = __dirname+'/experiments/pnt/assets/txt/pntstim.csv'
}



// remove all child elements from a div, here the convention will be to
// remove the elements from "contentDiv" after a trial
function clearScreen() {
  while (content.hasChildNodes())
  content.removeChild(content.lastChild)
}


// show text instructions on screen
function showPalpa1Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa1FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa1Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}



// show text instructions on screen
function showPalpa2Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa2FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa2Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}



// show text instructions on screen
function showPalpa8Instructions(txt) {
  clearScreen()
  // this test requires recording
  rec.startRec()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa8Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}



// show text instructions on screen
function showPalpa14Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa14FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa14Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}

// show text instructions on screen
function showPalpa15Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa15FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa15Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}

// show text instructions on screen
function showPalpa16Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa16FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa16Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}

// show text instructions on screen
function showPalpa17Instructions(txt) {
  dir = path.join(savePath, assessment, getSubjID(), getSessID())
  if (!fs.existsSync(dir)) {
    mkdirp.sync(dir)
  }
  palpa17FileToSave = path.join(dir,subjID+'_'+sessID+'_'+assessment+'_'+getDateStamp()+'.csv')
  clearScreen()
  var textDiv = document.createElement("div")
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  // var txtNode = document.createTextNode(txt)
  // p.appendChild(txtNode)
  p.innerHTML = txt
  textDiv.appendChild(p)
  var lineBreak = document.createElement("br")
  var btnDiv = document.createElement("div")
  var startBtn = document.createElement("button")
  var startBtnTxt = document.createTextNode("Start")
  startBtn.appendChild(startBtnTxt)
  startBtn.className = 'startBtn'
  startBtn.onclick = showNextPalpa17Trial
  btnDiv.appendChild(startBtn)
  content.appendChild(textDiv)
  content.appendChild(lineBreak)
  content.appendChild(btnDiv)
  return getTime()
}


function showImg(imgPath, imgDurationMS) {
  clearScreen()
  var imageEl = document.createElement("img")
  imageEl.src = imgPath
  content.appendChild(imageEl)
  clearTimeout(imgTimeoutID)
  imgTimeoutID = setTimeout(clearScreen, imgDurationMS)
  return getTime()
}



function stopRecordingAndShowNav() {
  clearScreen()
  rec.stopRec()
  openNav()
}



function clearScreenAndStopRecording() {
  clearScreen()
  rec.stopRec()
  openNav()
}



// load experiment module js file. All experiments are written in js, no separate html file
function loadJS (ID) {
  if (!document.getElementById(ID +'JS')) {
    expDir = path.join(__dirname, '/experiments/', ID, path.sep)
    scrElement = document.createElement("script")
    scrElement.type = "application/javascript"
    scrElement.src = expDir + ID + '.js'
    scrElement.id = ID + 'JS'
    document.body.appendChild(scrElement)
    console.log('loaded: ', scrElement.src)
    //might need to wait for scrElement.onload event -- test this
    //http://stackoverflow.com/a/38834971/3280952
  }
}


// unload js at the end of experiment run
function unloadJS (ID) {
  if (document.getElementById(ID +'JS')) {
    scrElement = document.getElementById(ID +'JS')
    document.body.removeChild(scrElement)
    console.log('removed: ', ID +'JS')
  }
}


// wait for time (in ms) and then run the supplied function.
// for now, the supplied function can only have one input variable.
// this WILL HANG the gui
function waitThenDoSync(ms, doneWaitingCallback, arg){
   var start = performance.now()
   var end = start;
   while(end < start + ms) {
     end = performance.now()
  }
  if (arg !== undefined) {
    doneWaitingCallback(arg)
  } else {
    doneWaitingCallback()
  }
}


// wait for time (in ms) and then run the supplied function.
// for now, the supplied function can only have one input variable. (this does not hang gui)
function waitThenDoAsync (ms, doneWaitingCallback, arg) {
  start = performance.now()
  setTimeout(function () {
    if (arg !== undefined) {
      doneWaitingCallback(arg)
    } else {
      doneWaitingCallback()
    }
    end = performance.now()
    console.log('Actual waitThenDo() time: ', end - start)
  }, ms)
}


 // keys object for storing keypress information
var keys = {
  key : '',
  time : 0,
  rt: 0,
  specialKeys: [' ', 'Enter', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Shift', 'Tab', 'BackSpace'],
  letterKeys: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  alphaNumericKeys: 'abcdefghijklmnopqrstuvwxyz1234567890'.split(''), // inspired by: http://stackoverflow.com/a/31755504/3280952
  whiteList: function () {
    return this.alphaNumericKeys.concat(this.specialKeys)
  },
  blackList: [],
  isAllowed: function () {
    idx = this.whiteList().indexOf(this.key)
    var val = false
    if (idx > 0) {
      val = true
    } else {
      val = false
    }
    return val
  }
}


// experiment object for storing session parameters, etc.
function experiment(name) {
  this.beginTime= 0,
  this.endTime= 0,
  this.duration= 0,
  this.name= name,
  this.rootpath= '',
  this.mediapath= '',
  this.getDuration = function () {
    return this.endTime - this.beginTime
  },
  this.setBeginTime = function() {
    this.beginTime = performance.now()
  },
  this.setEndTime = function () {
    this.endTime = performance.now()
  },
  this.getMediaPath = function () {
    this.mediapath = path.join(__dirname, '/assets/')
    return this.mediapath
  },
  this.getRootPath = function () {
    this.rootpath = path.join(__dirname,'/')
    return this.rootpath
  }
}


function getRT() {
  return keys.time - stimOnset
}


function checkPalpa1Accuracy() {
 if (keys.key === palpa1Trials[t].same.trim()) {
   acc = 1
 } else {
   acc = 0
 }
 return acc
}


function checkPalpa2Accuracy() {
 if (keys.key === palpa2Trials[t].same.trim()) {
   acc = 1
 } else {
   acc = 0
 }
 return acc
}


function checkPalpa14Accuracy() {
 if (keys.key === palpa14Trials[t].correctResp.trim()) {
   acc = 1
 } else {
   acc = 0
 }
 return acc
}


function checkPalpa15Accuracy() {
 if (keys.key === palpa15Trials[t].same.trim()) {
   acc = 1
 } else {
   acc = 0
 }
 return acc
}


function checkPalpa16Accuracy() {
console.log("t is: ", t)
 letters = [palpa16Trials[t].letter1.trim(), palpa16Trials[t].letter2.trim(), palpa16Trials[t].letter3.trim(), palpa16Trials[t].letter4.trim(), palpa16Trials[t].letter5.trim()]
 correctChoice = palpa16Trials[t].name.charAt(0) // first character is the target
 subjChoice = keys.key
 console.log("subjChoice: ", subjChoice)
 console.log(palpa16ErrorLookupTable[t][0])
 if (subjChoice === correctChoice) {
   acc = 1
   errorType = 'noErr'
 } else {
   acc = 0
   errIdx = palpa16ErrorLookupTable[t][0].indexOf(subjChoice)
   if (errIdx > -1) {
     errorType = palpa16ErrorLookupTable[t][1][errIdx]
   } else {
     errorType = 'KeyPressNotLinkedToErrorCode'
   }
 }
 console.log("errorType: ", errorType, " accuracy: ", acc)
 return {acc: acc,
        errorType: errorType}
}


function checkPalpa17Accuracy() {
  letters = [palpa17Trials[t].letter1.trim(), palpa17Trials[t].letter2.trim(), palpa17Trials[t].letter3.trim(), palpa17Trials[t].letter4.trim(), palpa17Trials[t].letter5.trim()]
  correctChoice = palpa17Trials[t].correctChoice.trim() // first character is the target
  subjChoice = keys.key
  if (subjChoice === correctChoice) {
    acc = 1
    errorType = 'noErr'
  } else {
    acc = 0
    errIdx = palpa17ErrorLookupTable[t][0].indexOf(subjChoice)
    if (errIdx > -1) {
      errorType = palpa17ErrorLookupTable[t][1][errIdx]
    } else {
      errorType = 'KeyPressNotLinkedToErrorCode'
    }
  }
  console.log("errorType: ", errorType, " accuracy: ", acc)
  return {acc: acc,
         errorType: errorType}
}



function appendPalpa1TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa1DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa2TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa2DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa8TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa8DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa14TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa14DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa15TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa15DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa16TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa16DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function appendPalpa17TrialDataToFile(fileToAppend, dataArray) {
  dataArray.push(os.EOL)
  dataString = csvsync.stringify(dataArray)
  if (!fs.existsSync(fileToAppend)) {
    fs.appendFileSync(fileToAppend, palpa17DataFileHeader)
    fs.appendFileSync(fileToAppend, dataArray)
  } else {
    fs.appendFileSync(fileToAppend, dataArray)
  }
  console.log("appended file: ", fileToAppend)
}


function checkPalpa16ErrorType() {
  var errType = 'x'
  return errType
}


function checkPalpa17ErrorType() {
  var errType = 'x'
  return errType
}



// update keys object when a keydown event is detected
function updateKeys() {
  // gets called from: document.addEventListener('keydown', updateKeys);
  iti = 1500
  keys.key = event.key
  keys.time = performance.now() // gives ms
  keys.rt = 0
  console.log("key: " + keys.key)
  if (keys.key === '1' || keys.key === '2') {
    if (assessment === 'palpa1') {
      accuracy = checkPalpa1Accuracy()
      console.log("accuracy: ", accuracy)
      keys.rt = getRT()
      console.log("RT: ", keys.rt)
      appendPalpa1TrialDataToFile(palpa1FileToSave, [subjID, sessID, assessment, palpa1Trials[t].name.trim(), palpa1Trials[t].diffLoc.trim(), palpa1Trials[t].diffType.trim(), keys.key, keys.rt, accuracy])
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa1Trial()}, iti)
      //showNextPalpa1Trial()
    } else if (assessment === 'palpa2') {
      accuracy = checkPalpa2Accuracy()
      appendPalpa2TrialDataToFile(palpa2FileToSave, [subjID, sessID, assessment, palpa2Trials[t].name.trim(), palpa2Trials[t].diffLoc.trim(), palpa2Trials[t].diffType.trim(), palpa2Trials[t].freq.trim(), keys.key, keys.rt, accuracy])
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa2Trial()}, iti)
      //showNextPalpa2Trial()
    } else if (assessment === 'palpa14') {
      accuracy = checkPalpa14Accuracy()
      appendPalpa14TrialDataToFile(palpa14FileToSave, [subjID, sessID, assessment, palpa14Trials[t].PictureName.trim(), palpa14Trials[t].conditionType.trim(), keys.key, keys.rt, accuracy])
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa14Trial()}, iti)
      //showNextPalpa14Trial()
    } else if (assessment === 'palpa15') {
      accuracy = checkPalpa15Accuracy()
      appendPalpa15TrialDataToFile(palpa15FileToSave, [subjID, sessID, assessment, palpa15Trials[t].name.trim(), palpa15Trials[t].conditionType.trim(), keys.key, keys.rt, accuracy])
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa15Trial()}, iti)
      //showNextPalpa15Trial()
    }
  } else if (keys.key === 'ArrowLeft') {
    if (assessment === 'palpa1') {
      showPreviousPalpa1Trial()
    } else if (assessment === 'palpa2') {
      showPreviousPalpa2Trial()
    } else if (assessment === 'palpa8') {
      showPreviousPalpa8Trial()
    } else if (assessment === 'palpa14') {
      showPreviousPalpa14Trial()
    } else if (assessment === 'palpa15') {
      showPreviousPalpa15Trial()
    } else if (assessment === 'palpa16') {
      showPreviousPalpa16Trial()
    } else if (assessment === 'palpa17') {
      showPreviousPalpa17Trial()
    }
  } else if (keys.key === 'ArrowRight') {
    if (assessment === 'palpa8') {
      itiTimeOutID = setTimeout(function() {showNextPalpa8Trial()}, iti)
    }
  } else if (keys.letterKeys.indexOf(keys.key) > -1) {
    if (assessment === 'palpa16') {
      if(isPalpa16PracticeTrial == 0) {
        palpa16Result = checkPalpa16Accuracy()
        appendPalpa16TrialDataToFile(palpa16FileToSave, [subjID, sessID, assessment, palpa16Trials[t].practice.trim(), palpa16Trials[t].name.trim(), palpa16Trials[t].name.charAt(0), palpa16Trials[t].wordOrNot.trim(), keys.key, keys.rt, palpa16Result.acc, palpa16Result.errorType])
      }
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa16Trial()}, iti)
      //showNextPalpa16Trial()
    } else if (assessment === 'palpa17') {
      if (isPalpa17PracticeTrial == 0) {
        palpa17Result = checkPalpa17Accuracy()
        appendPalpa17TrialDataToFile(palpa17FileToSave, [subjID, sessID, assessment, palpa17Trials[t].practice.trim(), palpa17Trials[t].name.trim(), palpa17Trials[t].correctChoice.trim(), palpa17Trials[t].wordOrNot.trim(), keys.key, keys.rt, palpa17Result.acc, palpa17Result.errorType])
      }
      clearScreen()
      itiTimeOutID = setTimeout(function() {showNextPalpa17Trial()}, iti)
      //showNextPalpa17Trial()
    }
  }
}


// store state of navigation pane
var nav = {
  hidden: false
}


function clearAllTimeouts() {
  clearTimeout(palpa1TimeoutID)
  clearTimeout(palpa2TimeoutID)
  clearTimeout(palpa8TimeoutID)
  clearTimeout(palpa14TimeoutID)
  clearTimeout(palpa15TimeoutID)
  clearTimeout(palpa16TimeoutID)
  clearTimeout(palpa17TimeoutID)
  clearTimeout(itiTimeOutID)
}


// open navigation pane
function openNav() {
  clearAllTimeouts()
  document.getElementById("navPanel").style.width = "150px"
  document.getElementById("contentDiv").style.marginLeft = "150px"
  document.body.style.backgroundColor = "rgba(0,0,0,0.3)"
  if (document.getElementById("imageElement")) {
    document.getElementById("imageElement").style.opacity = "0.1";
  }
  document.getElementById("closeNavBtn").innerHTML = "&times;"
}


// close navigation pane
function closeNav() {
    document.getElementById("navPanel").style.width = "0px";
    document.getElementById("contentDiv").style.marginLeft= "0px";
    document.getElementById("contentDiv").style.width= "100%";
    document.body.style.backgroundColor = "white";
    //document.getElementById("menuBtn").innerHTML = "&#9776;"
    if (document.getElementById("imageElement")) {
      document.getElementById("imageElement").style.opacity = "1";
    }
}


// toggle navigation pane, detect if hidden or not
function toggleNav() {
  if (nav.hidden) {
    openNav()
    nav.hidden = false
  } else {
    closeNav()
    nav.hidden = true
  }
}


// check if key that was pressed was the escape key or q. Quits experiment immediately
function checkForEscape() {
  key = event.key
  if (key === "Escape") {
    console.log("Escape was pressed")
    openNav()
    nav.hidden = false
    // unloadJS(exp.name)
    clearScreen()
    rec.stopRec()
  }
}

function getStarted() {
  subjID = document.getElementById("subjID").value.trim()
  sessID = document.getElementById("sessID").value.trim()
  assessment = document.getElementById("assessmentID").value.trim()
  console.log("assessment chosen: ", assessment)
  if (subjID === '' || sessID === '' || assessment === '') {
    console.log ('subject, session, or assessment is blank')
    alert('subject, session, or assessment is blank')
  } else {
    console.log ('subject is: ', subjID)
    console.log('session is: ', sessID)
    stopWebCamPreview()
    closeNav()
    resetTrialNumber()
    if (assessment === 'palpa1') {
      showPalpa1Instructions(palpa1Instructions)
    } else if (assessment === 'palpa2') {
      showPalpa2Instructions(palpa2Instructions)
    } else if (assessment === 'palpa8') {
      showPalpa8Instructions(palpa8Instructions)
    } else if (assessment === 'palpa14') {
      showPalpa14Instructions(palpa14Instructions)
    } else if (assessment === 'palpa15') {
      showPalpa15Instructions(palpa15Instructions)
    } else if (assessment === 'palpa16') {
      showPalpa16Instructions(palpa16Instructions)
    } else if (assessment === 'palpa17') {
      showPalpa17Instructions(palpa17Instructions)
    }
    //showInstructions(instructions)
  }
}


function showNextTrial() {
  clearTimeout(trialTimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxTrials) {
    clearScreen()
    t = maxTrials+1
    return false
  }
  picNum.value = t
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'pics', trials[t].PictureName.trim() + '.png')
  // content.appendChild(img)
  playAudio(path.join(exp.mediapath, 'beep.wav'))
  trialTimeoutID = setTimeout(showNextTrial, 1000 * timeoutTime)
  return getTime()
}


function showNextPalpa1Trial() {
  clearTimeout(palpa1TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxNumberOfPalpa1Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa1Trials+1
    return false
  }
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  stimOnset = playAudio(path.join(palpa1MediaPath, palpa1Trials[t].name.trim()+'.wav'))
  palpa1TimeoutID = setTimeout(showNextPalpa1Trial, palpa1TimeoutTime)
  return stimOnset
}


function showPreviousPalpa1Trial() {
  clearTimeout(palpa1TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  stimOnset = playAudio(path.join(palpa1MediaPath, palpa1Trials[t].name.trim()+'.wav'))
  palpa1TimeoutID = setTimeout(showNextPalpa1Trial, palpa1TimeoutTime)
  return getTime()
}


function showNextPalpa2Trial() {
  clearTimeout(palpa2TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxNumberOfPalpa2Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa2Trials+1
    return false
  }
  //var img = document.createElement("img")
  //img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  //img.style.height = "40%"
  //content.appendChild(img)
  stimOnset = playAudio(path.join(palpa2MediaPath, palpa2Trials[t].name.trim()+'.wav'))
  palpa2TimeoutID = setTimeout(showNextPalpa2Trial, palpa2TimeoutTime)
  return getTime()
}


function showPreviousPalpa2Trial() {
  clearTimeout(palpa2TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  stimOnset = playAudio(path.join(palpa2MediaPath, palpa2Trials[t].name.trim()+'.wav'))
  palpa2TimeoutID = setTimeout(showNextPalpa2Trial, palpa2TimeoutTime)
  return getTime()
}


function showNextPalpa8Trial() {
  clearTimeout(palpa8TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxNumberOfPalpa8Trials-1) {
    clearScreen()
    clearAllTimeouts()
    stopRecordingAndShowNav()
    t = maxNumberOfPalpa8Trials+1
    return false
  }
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  playAudio(path.join(palpa8MediaPath, palpa8Trials[t].name.trim()+'.wav'))
  palpa8TimeoutID = setTimeout(showNextPalpa8Trial, palpa8TimeoutTime)
  return getTime()
}


function showPreviousPalpa8Trial() {
  clearTimeout(palpa8TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  playAudio(path.join(palpa8MediaPath, palpa8Trials[t].name.trim()+'.wav'))
  palpa8TimeoutID = setTimeout(showNextPalpa8Trial, palpa8TimeoutTime)
  return getTime()
}


function showNextPalpa14Trial() {
  clearTimeout(palpa14TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxNumberOfPalpa14Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa14Trials+1
    return false
  }
  var img = document.createElement("img")
  img.src = path.join(path.join(palpa14MediaPath, palpa14Trials[t].PictureName.trim()+'.png'))
  img.style.height = "100%"
  content.appendChild(img)
  stimOnset = getTime()
  //playAudio(path.join(palpa14MediaPath, palpa14Trials[t].PictureName.trim()+'.wav'))
  palpa14TimeoutID = setTimeout(showNextPalpa14Trial, palpa14TimeoutTime)
  return stimOnset
}


function showPreviousPalpa14Trial() {
  clearTimeout(palpa14TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  var img = document.createElement("img")
  img.src = path.join(path.join(palpa14MediaPath, palpa14Trials[t].PictureName.trim()+'.png'))
  img.style.height = "100%"
  content.appendChild(img)
  stimOnset = getTime()
  //playAudio(path.join(palpa14MediaPath, palpa14Trials[t].name.trim()+'.wav'))
  palpa14TimeoutID = setTimeout(showNextPalpa14Trial, palpa14TimeoutTime)
  return stimOnset
}


function showNextPalpa15Trial() {
  clearTimeout(palpa15TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t > maxNumberOfPalpa15Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa15Trials+1
    return false
  }
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  stimOnset = playAudio(path.join(palpa15MediaPath, palpa15Trials[t].name.trim()+'.wav'))
  palpa15TimeoutID = setTimeout(showNextPalpa15Trial, palpa15TimeoutTime)
  return getTime()
}


function showPreviousPalpa15Trial() {
  clearTimeout(palpa15TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  stimOnset = playAudio(path.join(palpa15MediaPath, palpa15Trials[t].name.trim()+'.wav'))
  palpa15TimeoutID = setTimeout(showNextPalpa15Trial, palpa15TimeoutTime)
  return getTime()
}


function showNextPalpa16Trial() {
  clearTimeout(palpa16TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t == 0){
    isPalpa16PracticeTrial = 1
  } else if (t == 1) {
    isPalpa16PracticeTrial = 1
  } else {
    isPalpa16PracticeTrial = 0
  }
  if (t > maxNumberOfPalpa16Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa16Trials+1
    return false
  }
  console.log("t is: ", t)
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  var spaces = "                    "
  var textDiv = document.createElement("div")
  textDiv.style.letterSpacing = "70px"
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  p.style.fontSize = "60px"
  var txt = document.createTextNode(palpa16Trials[t].letter1.trim() + spaces
  + palpa16Trials[t].letter2.trim() + spaces
  + palpa16Trials[t].letter3.trim() + spaces
  + palpa16Trials[t].letter4.trim() + spaces
  + palpa16Trials[t].letter5.trim())
  p.appendChild(txt)
  textDiv.appendChild(p)
  content.appendChild(textDiv)
  stimOnset = playAudio(path.join(palpa16MediaPath, palpa16Trials[t].name.trim()+'.wav'))
  palpa16TimeoutID = setTimeout(showNextPalpa16Trial, palpa16TimeoutTime)
  return getTime()
}


function showPreviousPalpa16Trial() {
  clearTimeout(palpa16TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  var spaces = "                    "
  var textDiv = document.createElement("div")
  textDiv.style.letterSpacing = "70px"
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  p.style.fontSize = "60px"
  var txt = document.createTextNode(palpa16Trials[t].letter1.trim() + spaces
  + palpa16Trials[t].letter2.trim() + spaces
  + palpa16Trials[t].letter3.trim() + spaces
  + palpa16Trials[t].letter4.trim() + spaces
  + palpa16Trials[t].letter5.trim())
  p.appendChild(txt)
  textDiv.appendChild(p)
  content.appendChild(textDiv)
  stimOnset = playAudio(path.join(palpa16MediaPath, palpa16Trials[t].name.trim()+'.wav'))
  palpa16TimeoutID = setTimeout(showNextPalpa16Trial, palpa16TimeoutTime)
  return getTime()
}


function showNextPalpa17Trial() {
  clearTimeout(palpa17TimeoutID)
  closeNav()
  clearScreen()
  t += 1
  if (t == 0){
    isPalpa17PracticeTrial = 1
  } else if (t == 1) {
    isPalpa17PracticeTrial = 1
  } else {
    isPalpa17PracticeTrial = 0
  }
  if (t > maxNumberOfPalpa17Trials-1) {
    clearScreen()
    clearAllTimeouts()
    openNav()
    t = maxNumberOfPalpa17Trials+1
    return false
  }
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  var spaces = "                    "
  var textDiv = document.createElement("div")
  textDiv.style.letterSpacing = "70px"
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  p.style.fontSize = "60px"
  var txt = document.createTextNode(palpa17Trials[t].letter1.trim() + spaces
  + palpa17Trials[t].letter2.trim() + spaces
  + palpa17Trials[t].letter3.trim() + spaces
  + palpa17Trials[t].letter4.trim() + spaces
  + palpa17Trials[t].letter5.trim())
  p.appendChild(txt)
  textDiv.appendChild(p)
  content.appendChild(textDiv)
  stimOnset = playAudio(path.join(palpa17MediaPath, palpa17Trials[t].name.trim()+'.wav'))
  palpa17TimeoutID = setTimeout(showNextPalpa17Trial, palpa17TimeoutTime)
  return getTime()
}


function showPreviousPalpa17Trial() {
  clearTimeout(palpa17TimeoutID)
  closeNav()
  // t -= 1
  // if (t < 0) {
  //   t=0
  // }
  clearScreen()
  // var img = document.createElement("img")
  // img.src = path.join(exp.mediapath, 'sound512px' + '.png')
  // img.style.height = "40%"
  // content.appendChild(img)
  var spaces = "                    "
  var textDiv = document.createElement("div")
  textDiv.style.letterSpacing = "70px"
  textDiv.style.textAlign = 'center'
  var p = document.createElement("p")
  p.style.fontSize = "60px"
  var txt = document.createTextNode(palpa17Trials[t].letter1.trim() + spaces
  + palpa17Trials[t].letter2.trim() + spaces
  + palpa17Trials[t].letter3.trim() + spaces
  + palpa17Trials[t].letter4.trim() + spaces
  + palpa17Trials[t].letter5.trim())
  p.appendChild(txt)
  textDiv.appendChild(p)
  content.appendChild(textDiv)
  stimOnset = playAudio(path.join(palpa17MediaPath, palpa17Trials[t].name.trim()+'.wav'))
  palpa17TimeoutID = setTimeout(showNextPalpa17Trial, palpa17TimeoutTime)
  return getTime()
}


function resetTrialNumber() {
  t = -1
}


// event listeners that are active for the life of the application
document.addEventListener('keyup', checkForEscape)
document.addEventListener('keyup', updateKeys)
