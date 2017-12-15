var fs = require('fs');
var path = require('path');
var callerId = require('caller-id');

module.exports = function(options) {
  function getMainFile(modulePath) {
    if(isInOverrides(modulePath)){
      return getNewPathForModule(modulePath);
    }
    else{
      var json = JSON.parse(fs.readFileSync(modulePath + '/package.json'));
      return [modulePath + "/" + (json.main || "index.js")];
    }
    
  };

  function getNewPathForModule(mPath){
    for (var key in overrides) {
      if((options.nodeModulesPath + "/" + key) === mPath){
        if( Array.isArray(overrides[key].main)){
			return overrides[key].main.map(function(el){ return options.nodeModulesPath+'/'+key+'/'+el});
		}
		else return [options.nodeModulesPath + "/" + key + "/"+overrides[key].main];
      }
    }
    return 'unknown';
  }

  function isInOverrides(mPath){
    for (var key in overrides) {
      if((options.nodeModulesPath + "/" + key) === mPath) return true;
    }
    return false;
  }

  options = options || {};

  if(!options.nodeModulesPath) {
    options.nodeModulesPath = './node_modules';
  } else if(!path.isAbsolute(options.nodeModulesPath)) {
    var caller = callerId.getData();
    options.nodeModulesPath = path.join(path.dirname(caller.filePath), options.nodeModulesPath);
  }

  if(!options.packageJsonPath) {
    options.packageJsonPath = './package.json';
  } else if(!path.isAbsolute(options.packageJsonPath)) {
    var caller = callerId.getData();
    options.packageJsonPath = path.join(path.dirname(caller.filePath), options.packageJsonPath);
  }

  var buffer, packages, keys;
  var overrides;
  buffer = fs.readFileSync(options.packageJsonPath);
  packages = JSON.parse(buffer.toString());
  keys = [];
  overrides = packages.overrides || {};



  for (var key in packages.dependencies) {
    keys = keys.concat(getMainFile(options.nodeModulesPath + "/" + key));
  }

  if (options.devDependencies) {
    for (var key in packages.devDependencies) {
      keys.push(getMainFile(options.nodeModulesPath + "/" + key));
    }
  }

  return keys;
};
