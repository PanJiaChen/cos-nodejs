#!/usr/bin/env node

const { argv } = require('yargs')
const Cos = require('../lib/Cos')

const cos = new Cos(process.cwd(), {
  inlineOptions: argv
})

cos.upload()
