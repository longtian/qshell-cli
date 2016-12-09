/* eslint-disable space-before-function-paren */

var path = require('path')
var requestProgress = require('request-progress')
var request = require('request')
var fs = require('fs')
var os = require('os')
var yauzl = require('yauzl')
var mkdirp = require('mkdirp')
var ProgressBar = require('progress')
var md5File = require('md5-file')

var verserion = require('./../package.json').version
var packageName = require('./../package.json').name
var manifest = require('./manifest-' + verserion + '.json')
var downloadUrl = process.env.npm_config_qshell_cdnurl || process.env.QSHELL_CDNURL || manifest.defaultCDN
var tmpZipFilePath = path.join(os.tmpDir(), 'qshell-v' + verserion + '-' + Date.now() + '.zip') // /tmp/qshell-v1.8.5-1481273706539.zip
var targetEntry = manifest.entriesMap[os.platform() + '-' + os.arch()]
var writeFolder = path.join(__dirname, '..', 'vendor')
var binPath = path.join(writeFolder, 'qshell')
var bar // 进度条
var expectedMd5 = manifest.md5
var userAgent = packageName + '/' + verserion + ' (' + os.platform() + ' ' + os.arch() + ') ( Do not worry; be Happy )'

if (!targetEntry) {
  console.error('Your system is not officially supported')
  process.exit(1)
}

/**
 * 如果下载、解压过程被打断
 *
 * - 删除已经下载好的压缩包
 * - 删除已经解压的文件
 */
function onInterrupted() {
  try {
    if (fs.existsSync(tmpZipFilePath)) {
      fs.unlinkSync(tmpZipFilePath)
    }
    if (fs.existsSync(binPath)) {
      fs.unlinkSync(binPath)
    }
  } catch (e) {
    console.warn(e)
  }
  console.log('install is aborted')
  process.exit(1)
}

/**
 * 解压
 *
 * - 遍历压缩包找到对应的文件并解压到 vendor 目录下
 * - 修改该文件的权限为 755
 *
 * @param zipFileName
 */
function unZipFile(zipFileName) {
  yauzl.open(zipFileName, {
    lazyEntries: true
  }, function (err, zipFile) {
    if (err) {
      throw err
    }
    zipFile.readEntry()
    zipFile.on('entry', function (entry) {
      if (targetEntry === entry.fileName) {
        mkdirp.sync(writeFolder)
        zipFile.openReadStream(entry, function (errInReadStream, readStream) {
          if (errInReadStream) {
            throw errInReadStream
          }
          readStream.pipe(fs.createWriteStream(binPath))
          readStream.on('end', function () {
            zipFile.readEntry()
            console.log('unzip completed ' + binPath)
            fs.chmodSync(binPath, '755')
            console.log('chmod 755')
          })
        })
      } else {
        zipFile.readEntry()
      }
    })
  })
}

/**
 * 下载
 *
 * - 从网上下载 qshell 的指定版本的压缩包
 *
 * @param url
 */
function downloadFile(url) {
  requestProgress(request({
    url: url,
    header: {
      'User-Agent': userAgent
    }
  }))
    .on('progress', function (state) {
      if (!bar) {
        console.log('downloading %s', url)
        bar = new ProgressBar(':bar :percent(:current byte)', {
          total: state.size.total,
          width: 12 + url.length
        })
      }
      bar.curr = state.size.transferred
      bar.tick()
    })
    .on('end', function () {
      bar.curr = bar.total
      bar.tick()
      // 为了显示 100% 和换行 所以下面代码运行在 nextTick
      process.nextTick(function () {
        console.log('download completed: ' + tmpZipFilePath)
        var fileMd5 = md5File.sync(tmpZipFilePath)
        if (expectedMd5 !== fileMd5) {
          console.error('md5 does not match, expect ' + expectedMd5 + ' but got ' + fileMd5)
          onInterrupted()
        }
        console.log('md5 check ok')
        console.log('unzip to ' + tmpZipFilePath)
        unZipFile(tmpZipFilePath)
      })
    })
    .pipe(fs.createWriteStream(tmpZipFilePath))
}

process.on('SIGINT', onInterrupted)
process.on('SIGTERM', onInterrupted)

// 下载、解压正式开始
downloadFile(downloadUrl)
