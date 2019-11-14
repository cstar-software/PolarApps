{$i settings.inc}

program build_polar_apps;
uses
  PasScript;

procedure zip(dest, target: longstring);
var
  command: longstring;
begin
  command := 'ditto -c -k --rsrc --keepParent "'+target+'" "'+dirname(target).AddComponent(dest)+'"';
  writeln(command);
  exec(command);
end;

var
  files: TList;
  dir, name, path, bundle, dist: longstring;
begin
  dir := dirname(FPC_FILE_PATH);
  files := scandir(dir);
  for name in files do
    begin
      path := dir.AddComponent(name);
      if is_dir(path) and path.AddComponent('package.json').FileExists then
        begin
          writeln('building ', name, '...');
          chdir(path);
          exec('npm run build-mac && npm run osx-sign');
          dist := MakePath([path, 'dist', name+'-darwin-x64']);
          bundle := dist.AddComponent(name.AddExtension('app'));
          if file_exists(bundle) then
            zip(name+'.zip', bundle);
          //else
          //  fatal('bundle '+wrap(bundle)+' doesn''t exist');
        end;
    end;
  writeln('======= done =======');
end.