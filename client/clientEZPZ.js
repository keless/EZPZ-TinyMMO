var assetManager = require('connect-assetmanager');

var assetManagerGroups = {
  'js': {
    ///\/static\/javascripts\/[^/?*:;{}\\]+\.js/
    'route': /\/..\/shared\/EZPZ\/[^/?*:;{}\\]+\.js/, 
    'path': './shared/EZPZ/',
    'datatype': 'javascript',
    'files': [
      'ezpz.js', 'ezpz.client.js'
    ]
  }
}

module.exports = assetManager(assetManagerGroups)