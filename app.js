// fork getUserMedia for multiple browser versions, for those
// that need prefixes

navigator.getUserMedia = (navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia)

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes

var audioCtx = new (window.AudioContext || window.webkitAudioContext)()
var playAudioCtx = new (window.AudioContext || window.webkitAudioContext)()

// grab the mute button to use below

// set up the different audio nodes we will use for the app

var analyser = audioCtx.createAnalyser()
analyser.minDecibels = -90
analyser.maxDecibels = -10
analyser.smoothingTimeConstant = 0.85
var concertHallBuffer
var distortion = audioCtx.createWaveShaper()
var biquadFilter = audioCtx.createBiquadFilter()
var convolver = audioCtx.createConvolver()
var gainNode = audioCtx.createGain()

// grab audio track via XHR for convolver node

var soundSource, vSource
ajaxAudioTrack()
function ajaxAudioTrack () {
  var ajaxRequest = new window.XMLHttpRequest()

  ajaxRequest.open('GET', 'http://o6sbyl9mg.bkt.clouddn.com/1.mp3', true)

  ajaxRequest.responseType = 'arraybuffer'

  ajaxRequest.onload = function () {
    var audioData = ajaxRequest.response

    audioCtx.decodeAudioData(audioData)
      .then(function (buffer) {
        concertHallBuffer = buffer
        soundSource = playAudioCtx.createBufferSource()
        soundSource.buffer = concertHallBuffer

        soundSource.connect(playAudioCtx.destination)
        soundSource.loop = true

        vSource = audioCtx.createBufferSource()
        vSource.buffer = concertHallBuffer
        vSource.connect(analyser)
        analyser.connect(distortion)
        distortion.connect(biquadFilter)
        biquadFilter.connect(convolver)
        convolver.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        vSource.loop = true

        soundSource.start()
        vSource.start()
        visualize()
      })
      .catch(function (e) { throw new Error('Error with decoding audio data' + e.err) })
  }

  ajaxRequest.send()
}

// set up canvas context for visualizer

var canvas = document.querySelector('.visualizer')
var canvasCtx = canvas.getContext('2d')

var intendedWidth = document.querySelector('.wrapper').clientWidth

canvas.setAttribute('width', intendedWidth)

function visualize () {
  const WIDTH = canvas.width
  const HEIGHT = canvas.height
  var bufferLength
  var dataArray
  var draw
  analyser.fftSize = 4096
  bufferLength = analyser.frequencyBinCount

  dataArray = new Uint8Array(bufferLength)
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

  draw = function () {
    window.requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)

    canvasCtx.fillStyle = 'rgb(0, 0, 0)'
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT)

    var barWidth = (WIDTH / bufferLength) * 2.5
    var barHeight
    var x = 0

    for (var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i]

      canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)'
      canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2)

      x += barWidth + 1
    }
  }

  draw()
}
