'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')

module.exports.register = function () {
  this.once('contextStarted', async ({ playbook }) => {
    for (const it of await fsp.readdir(playbook.dir, { withFileTypes: true })) {
      if (it.isFile() && it.name.startsWith('vale.')) await fsp.rm(ospath.join(playbook.dir, it.name))
    }
  })

  this.once('contentAggregated', ({ contentAggregate }) => {
    for (const { origins } of contentAggregate) {
      for (const origin of origins) {
        addCollectorStep((origin.descriptor.ext ??= {}), {
          run: {
            command: '${{playbook.dir}}/.vale/run',
            env: {
              ANTORA_PLAYBOOK_DIR: '${{playbook.dir}}',
              ANTORA_ORIGIN_REFNAME: '${{origin.refname}}',
              ANTORA_ORIGIN_START_PATH: '${{origin.startPath}}',
              ANTORA_ORIGIN_URL: '${{origin.url}}',
              ANTORA_ORIGIN_WORKTREE: '${{origin.worktree}}',
            },
          },
        })
      }
    }
  })

  this.require('@antora/collector-extension').register.call(this, { config: {} })
}

function addCollectorStep (ext, step) {
  let append = Array.isArray(ext.collector)
  if (!append && ext.collector && (append = true)) ext.collector = [ext.collector]
  append ? ext.collector.push(step) : (ext.collector = step)
}
