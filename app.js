var canvas = document.querySelector('#bar')
var canvasCtx = canvas.getContext('2d')
var canvas2 = document.querySelector('#circle')
var canvasCtx2 = canvas2.getContext('2d')

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
var bufferLength
var dataArray

var startBtn = document.querySelector('#startBtn');

startBtn.addEventListener('click', function() {
    ajaxAudioTrack();
});

function ajaxAudioTrack () {
  var ajaxRequest = new window.XMLHttpRequest()

  ajaxRequest.open('GET', 'https://static.yugasun.com/yxqc.mp3/1.mp3', true)

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

        analyser.fftSize = 4096
        bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)

        visualize1()
        visualize2()
      })
      .catch(function (e) { throw new Error('Error with decoding audio data' + e.err) })
  }

  ajaxRequest.send()
}

// set up canvas context for visualizer

function visualize1 () {
  var WIDTH = canvas.width
  var HEIGHT = canvas.height
  var draw

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

function visualize2 () {
  var WIDTH = canvas2.width
  var HEIGHT = canvas2.height
  var draw
  canvasCtx2.clearRect(0, 0, WIDTH, HEIGHT)
  draw = function () {
    window.requestAnimationFrame(draw)
    analyser.getByteFrequencyData(dataArray)

    canvasCtx2.fillStyle = 'rgb(0, 0, 0)'
    canvasCtx2.fillRect(0, 0, WIDTH, HEIGHT)

    var radius
    var x = WIDTH / 2
    var y = HEIGHT / 2

    for (var i = 0; i < bufferLength / 100; i++) {
      radius = Math.abs((dataArray[i] - 128) / 255 * 150)

      canvasCtx2.beginPath()
      canvasCtx2.fillStyle = 'rgb(' + (dataArray[i] + 100) + ',50,50)'
      canvasCtx2.globalAlpha = 0.2
      canvasCtx2.arc(x, y, radius, 0, 2 * Math.PI, false)

      canvasCtx2.fill()
      canvasCtx2.closePath()
    }
  }

  draw()
}
