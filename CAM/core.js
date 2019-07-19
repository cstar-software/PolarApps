const { remote, shell } = require('electron')
const {Menu, MenuItem} = remote
const path = require('path')
const csvsync = require('csvsync')
const fs = require('fs')
const $ = require('jQuery')
const {app} = require('electron').remote;
app.setName('CAM')
const appRootDir = require('app-root-dir').get() //get the path of the application bundle
const ffmpeg = appRootDir+'/ffmpeg/ffmpeg'
const exec = require( 'child_process' ).exec
const si = require('systeminformation');
const mkdirp = require('mkdirp');
var ipcRenderer = require('electron').ipcRenderer;
var moment = require('moment')
var content = document.getElementById("contentDiv")
var localMediaStream
var sys = {
  modelID: 'unknown',
  isMacBook: false // need to detect if macbook for ffmpeg recording framerate value
}
var exp = new experiment('CAM')
var rec = new ff()
exp.getRootPath()
exp.getMediaPath()
var userDataPath = path.join(app.getPath('userData'),'Data')
makeSureUserDataFolderIsThere()
var savePath
var isRecording = false

startWebCamPreview()
document.getElementById("recordBtn").onclick = toggleRecording




function checkForUpdateFromRender() {
  ipcRenderer.send('user-requests-update')
  //alert('checked for update')
}


function updateFilenamePreview() {
  filenameTextArea = document.getElementById("fileNamePreview")
  filenameTextArea.innerHTML = getSubjID() + "_" + getSessID() + "_" + getTaskID() + "_" + getDateStamp() + ".mp4"
}


function toggleRecording() {
  if (isRecording == false) {
    stopWebCamPreview()
    rec.startRec()
    isRecording = true
    document.getElementById("recordBtn").style.borderRadius = "20px";
  } else if (isRecording == true) {
    startWebCamPreview()
    rec.stopRec()
    isRecording = false
    document.getElementById("recordBtn").style.borderRadius = "50px";
  }
}


function getSubjID() {
  var subjID = document.getElementById("subjID").value.trim()
  if (subjID === '') {
    subjID = ''
  }
  return subjID
}

function getTaskID() {
  var taskID = document.getElementById("taskID").value.trim()
  if (taskID === '') {
    taskID = ''
  }
  return taskID
}

function getSessID() {
  var sessID = document.getElementById("sessID").value.trim()
  if (sessID === '') {
    sessID = ''
  }
  return sessID
}

function makeSureUserDataFolderIsThere() {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath)
  }
}


//camera preview on
function startWebCamPreview() {
  //clearScreen()
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
    //clearScreen()
    vidPrevEl = document.getElementById("webcampreview")
    content.removeChild(vidPrevEl)
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
  this.threadQueSize = '512',          // preallocation
  this.cameraFormat = 'avfoundation',  // macOS only
  this.cameraDeviceID = '0',           // macOS only
  this.audioDeviceID = '0',            // macOS only

  // ffmpeg 4.1 options:
  // see "man ffpeg" for more information
  // static ffmpeg builds: https://ffmpeg.zeranoe.com/builds/
  this.videoSize = '640x400',          // output video dimensions
  this.videoCodec = 'libx264',         // man ffmpeg for option -vcodec
  this.recQuality = '356k',            // man ffmpeg for option -b 
  this.audioQuality = '64k',           // man ffmpeg for option -aq
  this.audioVolume = '1.0',            
  // note: required for libx264 to play in QuickTime
  // https://superuser.com/questions/820134/why-cant-quicktime-play-a-movie-file-encoded-by-ffmpeg
  this.pixelFormat = 'yuv420p',        // bits per pixel 12

  this.videoExt = '.mp4',
  this.isRecording = false,
  this.getSubjID = function() {
    var subjID = document.getElementById("subjID").value.trim()
    if (subjID === '') {
      console.log ('subject is blank')
      //alert('Participant field is blank!')
      subjID = '0000'
    }
    return subjID
  },
  this.getSessID = function () {
    var sessID = document.getElementById("sessID").value.trim()
    if (sessID === '') {
      console.log ('session is blank')
      //alert('Session field is blank!')
      sessID = '0000'
    }
    return sessID
  },
  this.getTaskID = function () {
    var taskID = document.getElementById("taskID").value.trim()
    if (taskID === '') {
      console.log ('task is blank')
      //alert('task field is blank!')
      taskID = 'notask'
    }
    return taskID
  },
  this.datestamp = getDateStamp(),
  this.makeOutputFolder = function () {
    outpath = path.join(savePath, "CAM", getSubjID(), getSessID())
    console.log(outpath)
    if (!fs.existsSync(outpath)) {
      mkdirp.sync(outpath)
    }
    return outpath
  }
  this.outputFilename = function() {
    return path.join(this.makeOutputFolder(), this.getSubjID()+'_'+this.getSessID()+'_'+this.getTaskID()+'_'+getDateStamp()+this.videoExt)
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
      this.ffmpegPath +
      ' ' + this.shouldOverwrite +
      ' -thread_queue_size ' + this.threadQueSize +
      ' -f ' + this.cameraFormat +
      ' -framerate ' + this.getFramerate().toString() +
      ' -i "' + this.cameraDeviceID + '":"' + this.audioDeviceID + '"' +
      ' -s ' + this.videoSize +
      ' -b:v ' + this.recQuality +
      ' -aq ' + this.audioQuality +
      ' -filter:a "volume=' + this.audioVolume + '" ' + 
      ' -vcodec ' + this.videoCodec +
      ' -pix_fmt ' + this.pixelFormat +
      ' -r ' + this.getFramerate().toString() +
      '  ' + '"' + this.outputFilename() + '"'
    ]
    cmd = cmd.toString()
    console.log('ffmpeg cmd: ')
    console.log(cmd)
    this.isRecording = true
    exec(cmd,{maxBuffer: 2000 * 1024}, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        alert('Recording Stopped')
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


// remove all child elements from a div, here the convention will be to
// remove the elements from "contentDiv" after a trial
function clearScreen() {
  while (content.hasChildNodes())
  content.removeChild(content.lastChild)
}

function clearAllTimeouts() {
  clearTimeout(trialTimeoutID)
}

// show single image on screen
function showImage(imgPath) {
  clearScreen()
  var imageEl = document.createElement("img")
  imageEl.src = imgPath
  content.appendChild(imageEl)
  return getTime()
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
