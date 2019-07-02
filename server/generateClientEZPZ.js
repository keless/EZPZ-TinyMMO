const uglify = require('uglify-es');
const path = require('path')
const fs = require('fs')

module.exports = function() {
  const walkSyncJS = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
      if (fs.statSync(path.join(dir, file)).isDirectory()) {
        filelist = walkSyncJS(path.join(dir, file), filelist)  //recurse directory
      } else if(path.extname(file) === '.js') {
        filelist = filelist.concat(path.join(dir, file))
      }
    })
    return filelist
  }
  
  var resourcePath = './shared/EZPZ/'
  var jsfiles = walkSyncJS(resourcePath)
  //console.log("minifying EZPZ files " + jsfiles)
  
  var options = {
    mangle: {
        properties: true,
    }
  }

  var sourceToMinify = {}
  jsfiles.forEach(file => {
    sourceToMinify[file] = fs.readFileSync(file, "utf8")
  })
  
  var minifiedSource = uglify.minify(sourceToMinify, options)
  if (minifiedSource.error) {
    console.log(minifiedSource.error)
  }
  
  fs.writeFileSync("./client/ezpz.js", minifiedSource.code, "utf8")
}