const fs = require('fs')
const path = require('path')
const { log, PluginError } = require('gulp-util')
const nunjucks = require('nunjucks')
const through = require('through2')

const PLUGIN_NAME = require('../package.json').name

module.exports = function ({ src, propName }) {
  try {
    checkPathIsDirAndAbsolute(src)
  } catch (e) {
    throw new PluginError(PLUGIN_NAME, e.message)
  }

  if (!propName) {
    throw new PluginError(PLUGIN_NAME, 'propName must be a non-empty string')
  }

  // Create a nunjucks environtment to do the rendering of the templates in src
  const nje = new nunjucks.Environment(new nunjucks.FileSystemLoader(src), { noCache: true })

  return through.obj(function (file, enc, callback) {
    if (!file.data) {
      log(PLUGIN_NAME, 'no data property provided; no nunjucks template will be rendered')
      callback()
      return
    }

    if (!file.data[propName]) {
      log(
        PLUGIN_NAME,
        `provided data isn't an object or doesn't have ${propName} property; template wont't be rendered.`,
        file.path
      )
      callback()
      return
    }

    const tpl = path.join(src, file.data[propName])
    const html = nje.render(tpl, file.data)
    file.contents = Buffer.from(html, 'utf8')
    file.extname = '.html'

    const filename = path.basename(file.path, path.extname(file.path))
    file.path = path.join(file.base, `${filename}.html`)
    callback(null, file)
  })
}

function checkPathIsDirAndAbsolute (dirpath, errCtxMsg) {
  const stat = fs.statSync(dirpath)

  if (!stat.isDirectory()) {
    throw new Error(`${errCtxMsg}. Not a path to a directory; value: ${dirpath}`)
  }

  if (!path.isAbsolute(dirpath)) {
    throw new (`${errCtxMsg}. Not an absolute path to a directory; value: ${dirpath}`)
  }
}
