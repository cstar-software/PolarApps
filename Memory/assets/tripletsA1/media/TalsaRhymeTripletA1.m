function catcherror = TalsaRhymeTripletA1
% help function will be here eventually
% this program is hosted on gitlab
% required software (dependencies):
%       -Psychtoolbox
%
%       -homebrew (OSX only)
%
%       -ffmpeg (installed using homebrew -- need binaries for WIN)
%           -brew install ffmpeg
%           -screen capture recorder (windows only)
%               *https://github.com/rdp/screen-capture-recorder-to-video-windows-free
%
%       -pidof
%           -brew install pidof
%
%       -Gstreamer 1.8 precompiled binaries (had to change permissions in finder (/Library/Frameworks)
%           -"help GStreamer" to get download link        


catcherror = 0; % default to no error code, if error, this variable will contain details, and a stack trace
%checkForUpdate(fileparts(mfilename('fullpath')));
[subj, runnum, doVideoRecord] = getSessionInfo; if isempty(subj); return; end

% ------------------------- user defined vars -----------------------------
% -------------------------------------------------------------------------
%doVideoRecord = true;
veryPreciseTimingNeeded = false;
dur = 60; % max duration of picture (per PNT instructions)
adir = fullfile(fileparts(mfilename('fullpath')),'audio');
picdir = fullfile(fileparts(mfilename('fullpath')),'pics'); % picture folder
datadir = fullfile(fileparts(mfilename('fullpath')),'data'); % folder for saving data
if ~exist(datadir,'dir') % if data folder doesn't exist, make it
    mkdir(datadir);
end
if isnumeric(subj); subj = num2str(subj); end;
if isnumeric(runnum); runnum = num2str(runnum); end
T = readtable(fullfile(fileparts(mfilename('fullpath')),'TalsaRhymeTripletA1.csv')); % read stimulus order file
datestring = getDateAndTime; % get date string down to the minute
datafile = fullfile(datadir,sprintf('%s_%s_%s_%s.csv',subj, runnum,mfilename, datestring)); % make data file name for saving
movfile = fullfile(datadir,sprintf('%s_%s_%s_%s.mp4',subj, runnum,mfilename, datestring)); % make video file name for recording
%instruction string for participant/clinician
instruct = sprintf(['You will see three pictures and hear three words.\n',...
                    'Click on the two pictures with rhyming names\n\n',...
                    '[Press the spacebar to begin]']);

% ------ don't edit below this line unless you know what you're doing -----
% -------------------------------------------------------------------------
spoolUpTime = 0;
setPathForFFMPEG;
KbName('UnifyKeyNames'); % make all keyboards similar
oldLevel = Screen('Preference', 'VisualDebugLevel', 1);
if veryPreciseTimingNeeded
    Screen('Preference', 'SkipSyncTests', 0); %#ok
else
    Screen('Preference', 'SkipSyncTests',2);
end
InitializePsychSound(1);
PsychDefaultSetupPlus(3); % set up PTB with some standard values
params = PsychSetupParams(0,1); % set some standard parameters for this session
n = size(T,1); % number of trials is the number of rows in Table T
%start ffmpeg recording
if doVideoRecord
    spoolUpTime = startRecording(movfile, 29.97); % start recording video with a 29.97fps framerate (a common value)
end
commandwindow;
startTime = GetSecs-spoolUpTime;
ShowInstructions(params, instruct, {'space', 'escape'});
WaitSecs(0.5); % wait for 500 ms just to have a smooth transition from instruct to task
key.sfp = strncmp('sfp',T.conditionType,length('sfp'));
key.sip = strncmp('sip',T.conditionType,length('sip'));
key.ssv = strncmp('ssv',T.conditionType,length('ssv'));
corrVec = [];

try
    keys = {'escape', 'RightArrow','r' '1','1!','2','2@'};
    
    for i=1:n
        picstim{1} = fullfile(picdir,[deblank(char(T.stim1(i))) '.bmp']); % construct image name
        picstim{2} = fullfile(picdir,[deblank(char(T.stim2(i))) '.bmp']);
        picstim{3} = fullfile(picdir,[deblank(char(T.stim3(i))) '.bmp']);
        audstim{1} = fullfile(adir,[deblank(char(T.stim1(i))) '.wav']); % construct image name
        audstim{2} = fullfile(adir,[deblank(char(T.stim2(i))) '.wav']);
        audstim{3} = fullfile(adir,[deblank(char(T.stim3(i))) '.wav']);
        picTime = GetSecs;
        [responseKey, allClicks, rt] = showStimulus(params, picstim, audstim, dur,keys,T.practice(i,1)); % do a trial
        T.stimsClicked{i,1} = allClicks; 
        isCorrect = strcmpi(T.correctResp(i,1),allClicks);
        T.isCorrect{i,1} = isCorrect;
        corrVec = [corrVec; isCorrect];
        T.response{i,1} = responseKey;
        T.RT{i,1} = rt;
        if ~T.practice(i,1)
            T.correctSFP{i,1} = sum(key.sfp(corrVec > 0)); % for starting at first non-practice item
            T.correctSIV{i,1} = sum(key.sip(corrVec > 0));
            T.correctSSV{i,1} = sum(key.ssv(corrVec > 0));
        end
        %save_to_base(1);
        if doVideoRecord
            T.startTimePointInVideo{i,1} = picTime - startTime;
            T.endTimePointInVideo{i,1} = GetSecs - startTime;
        end
        writetable(T,datafile);
        showInterTrialScreen(params, {'RightArrow','escape'})
    end
    Screen('Preference', 'VisualDebugLevel', oldLevel);
    CleanUp({datafile, movfile});
    WaitSecs(1);
    syncFilesToCloud({datafile, movfile}, subj, runnum);
    
catch catcherror
    CleanUp({datafile, movfile});
    WaitSecs(1);
    syncFilesToCloud({datafile, movfile}, subj, runnum);
end
end
%sub functions below





















function datestring = getDateAndTime
d = fix(clock);
datestring=sprintf('Y%04d_M%02d_D%02d_H%02d_M%02d_S%02d',...
    d(1),...
    d(2),...
    d(3),...
    d(4),...
    d(5),...
    d(6));
end


function startTime = ShowInstructions(params, instruct,keysToWaitFor)
if nargin < 3; keysToWaitFor = {'space', 'escape'}; end;
Screen('Flip',params.win); % for windows
DrawFormattedText(params.win, instruct, 'center', 'center',params.TextColor);
Screen('Flip',params.win);
RestrictKeysForKbCheck(cellfun(@KbName, keysToWaitFor));
deviceN = -1;
[startTime, keyCode] = KbWait(deviceN);
if strcmpi(KbName(keyCode), 'escape')
    CleanUp;
end
RestrictKeysForKbCheck([]);
Screen('Flip',params.win);
end


function CleanUp(files)
if nargin < 1
    files = [];
end
ListenChar(0);
sca;
RestrictKeysForKbCheck([]);
stopRecording
end %CleanUp


function [responseKey, allClicks, rt] = showStimulus(params,picstim, audstim, dur,keys,practice)
ShowCursor;
stim1Click = 'n';
stim2Click = 'n';
stim3Click = 'n';
rt = [];
allClicks = [stim1Click stim2Click stim3Click];
RestrictKeysForKbCheck(cellfun(@KbName, keys)); % only looks for keys we care about
timerStart = GetSecs; % start a timer to keep track of elapsed time
if numel(picstim) ~= numel(audstim); error('trial must have same number of audio files and pictures'); end;
for i = 1:numel(picstim);
    img(i).stim = imread(picstim{i});
    [aud(i).y, aud(i).fs] = psychwavread(audstim{i}); aud(i).y = aud(i).y'; nchan = size(aud(i).y,1); % Number of rows == number of channels.
    if nchan < 2
        aud(i).y = [aud(i).y ; aud(i).y];
        nchan = 2;
    end
end
picSize = 200;
picSizeRect = [0 0 picSize picSize];
picXs = round(linspace(1,params.maxXpixels,7));
picYs = round(linspace(1,params.maxYpixels,7));
rect1 = CenterRectOnPoint(picSizeRect,picXs(2),picYs(2));
rect2 = CenterRectOnPoint(picSizeRect,picXs(4),picYs(4));
rect3 = CenterRectOnPoint(picSizeRect,picXs(6),picYs(6));
picRects = [rect1;rect2;rect3]';
Screen('Flip',params.win); % clear the screen
trialElapsedTime = 0; % init elapsed time variable with zero value (will count up to dur)
keyIsPressed = 0; % init repsonse checker
responseKey = 'o'; % init response key (default to "No Response (o)" code
tex1 = Screen('MakeTexture', params.win, img(1).stim); % make texture
tex2 = Screen('MakeTexture', params.win, img(2).stim); % make texture
tex3 = Screen('MakeTexture', params.win, img(3).stim); % make texture
Screen('DrawTextures', params.win, [tex1 tex2 tex3], [], picRects, 0); % draw the texture in back buffer
if practice
    DrawFormattedText(params.win,'Practice','center',params.tsize+5,params.colors.black);
end
stimOnset = Screen('Flip', params.win);% flip image to screen
Screen('Close');
for i = 1:numel(audstim)
    pahandle = PsychPortAudio('Open', [], [], 0, aud(i).fs, nchan);
    PsychPortAudio('FillBuffer', pahandle, aud(i).y);
    reps = 1;
    fileDur = (size(aud(i).y,2)/aud(i).fs);
    timerStart = PsychPortAudio('Start', pahandle, reps, 0, 1);
    WaitSecs(fileDur);
    WaitSecs(0.125); % 125ms between stim
    PsychPortAudio('Close',pahandle);
end
while ~keyIsPressed & trialElapsedTime < dur %#ok
    [keyIsPressed, t, keyCode] = KbCheck(-1); % check for keyboard press
    [x,y,buttons] = GetMouse;
    if any(buttons)
        if IsInRect(x,y,rect1)
            stim1Click = 'y';
            if isempty(rt); rt = GetSecs-stimOnset; end;
        elseif IsInRect(x,y,rect2)
            stim2Click = 'y';
            if isempty(rt); rt = GetSecs-stimOnset; end;
        elseif IsInRect(x,y,rect3)
            stim3Click = 'y';
            if isempty(rt); rt = GetSecs-stimOnset; end;
        end
        allClicks = [stim1Click stim2Click stim3Click];
        if numel(strfind(allClicks,'y')) > 1
            keyIsPressed = 1;
            WaitSecs(0.250);
        end
    end
    if keyIsPressed % check if a response happened
        responseKey = KbName(keyCode);
        if strcmpi(responseKey, 'escape') % if escape was pressed then exit the session
            CleanUp;
        elseif strcmpi(responseKey,'r')
            for i = 1:numel(audstim)
                pahandle = PsychPortAudio('Open', [], [], 0, aud(i).fs, nchan);
                PsychPortAudio('FillBuffer', pahandle, aud(i).y);
                reps = 1;
                fileDur = (size(aud(i).y,2)/aud(i).fs);
                timerStart = PsychPortAudio('Start', pahandle, reps, 0, 1);
                WaitSecs(fileDur);
                WaitSecs(0.125); % 125ms between stim
                PsychPortAudio('Close',pahandle);
                keyIsPressed = 0;
            end
        end
    end
    trialElapsedTime = t - timerStart; % keep track of elapsed time
end
allClicks = [stim1Click stim2Click stim3Click];
Screen('Flip', params.win); % clear the screen
KbReleaseWait(-1);
end


function PsychDefaultSetupPlus(featureLevel)
% PsychDefaultSetup(featureLevel) - Perform standard setup for Psychtoolbox.

% Default colormode to use: 0 = clamped, 0-255 range. 1 = unclamped 0-1 range.
global psych_default_colormode;
psych_default_colormode = 0;

% Reset KbName mappings:
clear KbName;

% Define maximum supported featureLevel for this Psychtoolbox installation:
maxFeatureLevel = 3;

% Sanity check featureLevel argument:
if nargin < 1 || isempty(featureLevel) || ~isscalar(featureLevel) || ~isnumeric(featureLevel) || featureLevel < 0
    error('Mandatory featureLevel argument missing or invalid (not a scalar number or negative).');
end

% Always AssertOpenGL:
AssertOpenGL;

% Level 1+ requested?
if featureLevel >= 1
    % Unify keycode to keyname mapping across operating systems:
    KbName('UnifyKeyNames');
end

% Level 2+ requested?
if featureLevel >= 2
    % Initial call to timing functions
    % Set global environment variable to ask PsychImaging() to enable
    % normalized color range for all drawing commands and Screen('MakeTexture'):
    psych_default_colormode = 1;
    GetSecs; WaitSecs(0.001);
end

% Level 2+ requested?
if featureLevel >= 3
    %suppress keypress to command window,
    %and hide the mouse pointer (usefull is most visual experiments)
    ListenChar(2);
    HideCursor;
end


if featureLevel > maxFeatureLevel
    error('This installation of Psychtoolbox can not execute scripts at the requested featureLevel of %i, but only up to level %i ! UpdatePsychtoolbox!', featureLevel, maxFeatureLevel);
end
return;
end

function params = PsychSetupParams(doAlphaBlending,doMultiSample, background, textColor)
%sets up some normal values used in experiments such as a gray background
%and Arial font, and a large text size, etc...
%saves all relevant screen info to the 'params' structure so that the
%entire structure can be passed in and out of functions, rather than
%zillions of variables. Also makes it expandable.
%
% History:
% 29-May-2015   th     made initial version of the function
if nargin < 3
    background = [1 1 1];
end
if nargin < 4
    textColor = [0 0 0];
end

global psych_default_colormode;
%make params structure
params = struct;
%set some defualt, common colors
params.colors.white = [1 1 1];
params.colors.black = [0 0 0];
params.colors.gray = [0.5 0.5 0.5];
params.colors.red = [1 0 0];
params.colors.green = [0 1 0];
%check if using normalized color values or not
if psych_default_colormode == 0
    params.colors.white = [255 255 255];
    params.colors.gray = [128 128 128];
end
%choose max screen number (will be the external monitor if connected)
params.screen = max(Screen('Screens'));
params.font = 'Arial'; %set the global font for PTB to use
params.tsize = 18; %set text size
params.TextColor = textColor; %set global text color
%set the background color of the screen (defaults to gray)
params.background = background;
params.multiSample = [];
if doMultiSample
    params.multiSample = 4;%set to a value greater than 0 if you want super sampling
end
%open the PTB window
[params.win, params.rect] = PsychImaging('OpenWindow', params.screen, params.background,[],[],[],[],params.multiSample);
%get screen width and height
[params.maxXpixels, params.maxYpixels] = Screen('WindowSize', params.win);
if doAlphaBlending
    %Set blend function for alpha blending
    Screen('BlendFunction', params.win, 'GL_SRC_ALPHA', 'GL_ONE_MINUS_SRC_ALPHA');
end
%find center of screen
[params.Xc,params.Yc] = RectCenter([0 0 params.maxXpixels params.maxYpixels]);
%now that the window pointer exists, set some values from earlier
Screen('TextSize', params.win, params.tsize);
Screen('TextFont',params.win, params.font);
Screen('TextSize',params.win, params.tsize);
Screen('TextStyle', params.win, 1);

%Maximum priority level
params.topPriorityLevel = MaxPriority(params.win);
Priority(params.topPriorityLevel);
%Query the frame duration
params.ifi = Screen('GetFlipInterval', params.win);
end

function doBeepSound
amp=2; 
fs=44100;  % sampling frequency
duration=0.1;
freq=500;
values=0:1/fs:duration;
a=amp*sin(2*pi*freq*values);
sound(a,fs);
end %doBeepSound


function showBreakScreen(params, keys)
RestrictKeysForKbCheck(cellfun(@KbName, keys)); % only looks for keys we care about
DrawFormattedText(params.win, 'BREAK, press right arrow to continue','center','center',params.TextColor);
Screen('Flip', params.win);
KbWait(-1);
Screen('Flip', params.win);
WaitSecs(0.500); % for smooth transition back to task
end

function showInterTrialScreen(params, keys)
RestrictKeysForKbCheck(cellfun(@KbName, keys)); % only looks for keys we care about
DrawFormattedText(params.win, sprintf('Press right arrow for next trial'),'center','center',params.TextColor);
Screen('Flip', params.win);
KbWait(-1);
Screen('Flip', params.win);
WaitSecs(0.500); % for smooth transition back to task
KbReleaseWait(-1);
end

function spoolUpTime = startRecording(movfile, frate)
%http://www.oodlestechnologies.com/blogs/PICTURE-IN-PICTURE-effect-using-FFMPEG
if nargin < 2
    frate = 30; % default value that works on my development computer (macbook 2015ish, osx 10.10.4)
end
spoolUpTime = 2;
if ismac % tested on macbook pro 2015+ i7 osx 10.10.4
    %in the future it would be nice to have a distributable binary, for now
    %we use homebrew
    %ffmpegpath = fullfile(fileparts(mfilename('fullpath')),'ffmpeg');
    ffmpegpath = 'ffmpeg';
    fmt = 'avfoundation';
    videoSize = '1280x720';
    screenInputDevice = '"1"';
    videoInputDevice = '"0"';
    audioInputDevice = '"0"';
    videoQuality = 30; % range from 0 to 60ish (lower numbers mean HUGE files, but better quality -- lossless) -- 40 seems ok 
    codec = 'libx264';
elseif IsWin % not tested yet
    warning('FFmpeg video recording is experimental on windows'); 
    ffmpegpath = 'ffmpeg';
    fmt = 'dshow';
    videoSize = '320x240'; %smaller because.... windows....
    %------- only tested on HP ProBook Win 7 ---------%
    screenInputDevice = 'video="screen-capture-recorder"';
    videoInputDevice = 'video="HP HD Camera"';
    audioInputDevice = 'audio="Internal Microphone (Conexant S"';
    %-------------------------------------------------%
    videoQuality = 40; % range from 0 to 60ish (lower numbers mean HUGE files, but better quality -- lossless) -- 40 seems ok 
end
cmd = sprintf(['%s -y -thread_queue_size 50 ','-f %s ',...
    '-framerate %2.2f -i %s -thread_queue_size 50 ',...
    '-f %s -framerate %2.2f -video_size %s ',...
    '-i %s:%s -c:v %s -crf %d -preset ultrafast ',...
    '-filter_complex ' '"[0]scale=iw/8:ih/8 [pip]; [1][pip] overlay=main_w-overlay_w-10:main_h-overlay_h-10" ',...
    '-r %2.2f "%s" &'],...
    ffmpegpath, fmt, frate, screenInputDevice, fmt, frate, videoSize, videoInputDevice, audioInputDevice,codec,videoQuality,frate,movfile);
% cmd = sprintf(['%s -y ',...
%     '-f %s -framerate %2.2f -video_size %s ',...
%     '-i %s:%s -c:v %s -crf %d -preset ultrafast ',...
%     '-r %2.2f %s &'],...
%     ffmpegpath, fmt, frate, videoSize, videoInputDevice, audioInputDevice,codec,videoQuality,frate,movfile);
disp(cmd);
system(cmd);
WaitSecs(spoolUpTime); % need to wait before checking if recording started -- give it time to actually start
if ~isRecording % if the recording did not start (usually due to an incompatible framerate for the hardware)
    if frate < 30
        frate = 30; % if lower framerate was tried (29.97) then try 30 now
    else
        frate = 29.97;
    end
    cmd = sprintf(['%s -y -thread_queue_size 50 ','-f %s ',...
        '-framerate %2.2f -i %s -thread_queue_size 50 ',...
        '-f %s -framerate %2.2f -video_size %s ',...
        '-i %s:%s -c:v %s -crf %d -preset ultrafast ',...
        '-filter_complex ' '"[0]scale=iw/8:ih/8 [pip]; [1][pip] overlay=main_w-overlay_w-10:main_h-overlay_h-10" ',...
        '-r %2.2f "%s" &'],...
        ffmpegpath, fmt, frate, screenInputDevice, fmt, frate, videoSize, videoInputDevice, audioInputDevice,codec,videoQuality,frate,movfile);
%     cmd = sprintf(['%s -y ',...
%         '-f %s -framerate %2.2f -video_size %s ',...
%         '-i %s:%s -c:v %s -crf %d -preset ultrafast ',...
%         '-r %2.2f %s &'],...
%     ffmpegpath, fmt, frate, videoSize, videoInputDevice, audioInputDevice,codec,videoQuality,frate,movfile);    
    disp(cmd); % display the command to matlab command window for debugging
    system(cmd);
    WaitSecs(spoolUpTime); % give the hardware time to actually get going
    if ~isRecording % if still not recording, throw an error
        CleanUp;
        error('ffmpeg recording was requested, but failed to start. This may be due to an incompatible setting')
    end
end
end %startRecording

function stopRecording
if ismac
    system('killall ffmpeg');
elseif IsWin
    system('Taskkill /IM ffmpeg.exe'); % request that ffmpeg stop
    system('Taskkill /IM cmd.exe /t'); % kill command window that pops up (and all child processes)
    pause(2);
    system('Taskkill /IM cmd.exe /t'); % do it again for good measure
end
end %stopRecording

function val = isRecording
if ismac
    [~, r] = system('pidof ffmpeg');
    if isempty(r);
        val = 0;
    else
        val = 1;
    end
elseif IsWin
    [~, r] = system('tasklist /FI "IMAGENAME eq ffmpeg.exe"');
    if strfind(r, 'ffmpeg')
        val = true;
    else
        val = false;
    end
end
end % isRecording

function PATH = setPathForFFMPEG
if IsWin
    PATH = getenv('PATH');
    setenv('PATH', [PATH ';' fullfile(fileparts(mfilename('fullpath')),'winffmpeg')]);
    PATH = getenv('PATH');
    disp(PATH);
else
    PATH = getenv('PATH');
    setenv('PATH', [PATH ':/usr/local/bin']);
    PATH = getenv('PATH');
    disp(PATH);
end
end % setPathForFFMPEG

function checkForUpdate(repoPath)
prevPath = pwd;
cd(repoPath);
if exist('.git','dir') %only check for updates if program was installed with "git clone"
    [~, r] = system('git fetch origin','-echo');
    if strfind(r,'fatal')
        warning('Unabe to check for updates. Internet issue?');
        return;
    end
    [~, r] = system('git status','-echo');
    if strfind(r,'behind')
        if askToUpdate
            system('git reset --hard HEAD');
            system('git pull');
            showRestartMsg
        end
    end
else %do nothing for now
    warning('To enable updates run "!git clone git@gitlab.com:Hanayik/%s.git"',mfilename);
end
cd(prevPath);
end % checkForUpdate

function showRestartMsg
uiwait(msgbox('The program must be restarted for changes to take effect. Click "OK" to quit the program. You will need to restart it just as you normally would','Restart Program'))
exit;
end % showRestartMsg

function a = askToUpdate
% Construct a questdlg
choice = questdlg(sprintf('An update for %s is available. Would you like to update?',mfilename), ...
	'Auto update', ...
	'Yes','No','Yes');
% Handle response
switch choice
    case 'Yes'
        a = true;
    case 'No'
        a = false;
end
end % askToUpdate


function [subj, runnum, doVideoRecord] = getSessionInfo
subj = [];
runnum = [];
doVideoRecord = [];
doColorPNT = [];
prompt={'Participant: ','Session: ', 'Record video? (y,n): '};
   name = mfilename;
   numlines=1;
   defaultanswer={'0','0','y'};
 
answer=inputdlg(prompt,name,numlines,defaultanswer);
if isempty(answer); return; end
subj = answer{1};
runnum = answer{2};
if strcmpi(answer{3},'y'); doVideoRecord = 1; else doVideoRecord = 0; end
end

function syncFilesToCloud(files, subj, runnum)
if isempty(files); return; end;
cloudDir = ('~/Box Sync/MUSC_POLAR'); % check for box (MUSC computers)
if ~isdir(cloudDir)
    cloudDir = ('~/Dropbox (C-STAR)'); % if that doesn't exist check this
    if ~isdir(cloudDir) 
        cloudDir = ('~/Dropbox'); % check this last
        if ~isdir(cloudDir)
            warning('Data syncing not available. No Drop(box) folder detected at %s', cloudDir);
            return;
        end
    end
end;
taskFolder = fullfile(cloudDir,'PolarData', mfilename, subj, runnum);
if ~isdir(taskFolder)
    mkdir(taskFolder);
end
n = size(files,1);
h = waitbar(0,'Copying files for data syncing...');
steps = n;
for i = 1:steps
    [~,nm,ext] = fileparts(files{i});
    copyfile(files{i},fullfile(taskFolder,[nm ext]));
    waitbar(i / steps)
end
close(h) 
end










