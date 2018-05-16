const fs = require('fs')
const path = require('path')
const COS = require('cos-nodejs-sdk-v5')
const util = require('./util')
const defaultConfig = require('./defaultConfig')

module.exports = class Service {
  constructor(context, {
    inlineOptions
  } = {}) {
    this.context = context
    this.projectOptions = this.loadProjectOptions()
    this.config = Object.assign(defaultConfig, inlineOptions, this.projectOptions)

    this.cos = new COS({
      AppId: this.config.AppId,
      SecretId: this.config.SecretId,
      SecretKey: this.config.SecretKey
    })

    this.limitedPutObject = this.genLimitedPutObject(10)
    this.ERR_MSG = {
      svc_unavailable: 'COS service health-checking failed.',
      bkt_unavailable: 'Bucket does not exist or is unavailable.'
    }
    this.ERRORS = {
      empty_dir: {
        code: 1,
        message: () => `No files in specified filepath: ${path.resolve(this.context, this.config.Filepath)}`
      },
      upload_obj_failed: {
        code: 2,
        message: filename => `Error occurred when upload file: ${filename}`
      }
    }
  }

  getService(cb = util.noop) {
    this.cos.getService(cb)
  }

  headBucket(cb = util.noop) {
    this.cos.headBucket({
      Bucket: this.config.Bucket,
      Region: this.config.Region
    }, cb)
  }

  genLimitedPutObject(limit = 10) {
    let count = 0
    const queue = []
    const _this = this
    function next() {
      if (count < limit && queue.length) {
        const task = queue.shift()
        count++
        _this.cos.putObject(task.options, (err, data) => {
          count--
          task.cb(err, data)
          next()
        })
        next()
      }
    }

    return function(options, cb = util.noop) {
      queue.push({
        options,
        cb
      })
      next()
    }
  }

  putObjects() {
    const fnames = util.getFilenames(path.resolve(this.context, this.config.Filepath), this.config.Recursive)
    const fcount = fnames.length
    if (!fcount) {
      throw new Error(this.ERRORS.empty_dir.message())
    }

    try {
      let okCnt = 0

      fnames.forEach(fname => {
        const filepath = path.resolve(this.context, `${this.config.Filepath}/${fname}`)
        this.limitedPutObject({
          Bucket: this.config.Bucket,
          Region: this.config.Region,
          Key: `${this.config.Directory ? `${this.config.Directory}/` : ''}${fname}`,
          Body: fs.createReadStream(filepath),
          ContentLength: fs.statSync(filepath).size,
          onProgress(data) {
            // console.log(JSON.stringify(data))
          }
        }, (err, data) => {
          if (err) {
            throw new Error(JSON.stringify(err))
          } else {
            console.log(`Upload ${fname} successfully`)

            if (++okCnt === fcount) {
              console.log(`All ${okCnt} files are successfully uploaded.`)
              util.noop
            }
          }
        })
      })
    } catch (e) {
      if (e instanceof Error) {
        throw e
      } else {
        throw new Error('Unidentified error.')
      }
    }
  }

  checkService(cb) {
    this.getService((err, data) => {
      if (err) {
        throw new Error(this.ERR_MSG.svc_unavailable)
      } else {
        console.log('COS service checking done.')
        this.headBucket((err, data) => {
          if (err) {
            throw new Error(this.ERR_MSG.bkt_unavailable)
          } else {
            console.log(`COS bucket '${this.config.Bucket}' checking done.`)
            cb()
          }
        })
      }
    })
  }

  upload() {
    this.checkService(() => {
      console.log('Start uploading files to COS...')
      this.putObjects()
    })
  }

  loadProjectOptions() {
    let fileConfig

    const configPath = path.resolve(this.context, 'cos/config.js')
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = require(configPath)
        if (!fileConfig || typeof fileConfig !== 'object') {
          fileConfig = null
          throw new Error(
            'Error loading cos-config: should export an object.'
          )
        }
      } catch (e) { console.log(e) }

      if (fileConfig) {
        return fileConfig
      }
      return {}
    }
  }
}
