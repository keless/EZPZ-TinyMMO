const uglify = require('uglify-es');
const path = require('path')
const fs = require('fs')
const Utility = require('../shared/EZPZ/Utility')
const removeFromArray = Utility.removeFromArray

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
  
  var resourcePath = path.normalize('./shared/EZPZ/')
  var jsfiles = walkSyncJS(resourcePath)

  //move known dependancies to the top
  var moveToFront = function(filename, array) {
    removeFromArray(array, filename)
    array.unshift(filename)
  }

  moveToFront(path.normalize("shared/EZPZ/TableView.js"), jsfiles) //before MenuView
  moveToFront(path.normalize("shared/EZPZ/NodeView.js"), jsfiles)
  moveToFront(path.normalize("shared/EZPZ/AppStateController.js"), jsfiles)

  
  var options = {
    mangle: false,
    compress: {
      conditionals: false
    }
  }

  var sourceToMinify = {}
  sourceToMinify["hack.js"] = "var exports = {}"
  jsfiles.forEach(file => {
    sourceToMinify[file] = fs.readFileSync(file, "utf8")
  })
  
  var minifiedSource = uglify.minify(sourceToMinify, options)
  if (minifiedSource.error) {
    console.log(minifiedSource.error)
  }
  
  fs.writeFileSync("./client/ezpz.js", minifiedSource.code, "utf8")
}