function noteToFrequency(noteName) {
  if (noteName === '.') {
    return 0;   // silence
  }

  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(noteName);
  if (!match) {
    throw new Error(`bad note name: ${noteName}`);
  }

  const letter = match[1];
  const sharpOrFlat = match[2];
  const octaveNum = match[3];

  let shiftFromC0 = "C D EF G A B".indexOf(letter) + 12*(+octaveNum);
  if (sharpOrFlat === '#') shiftFromC0++;
  if (sharpOrFlat === 'b') shiftFromC0--;

  const shiftFromA4 = shiftFromC0 - 9 - 4*12;
  return 440 * Math.pow(2, shiftFromA4 / 12);
}

let audioContext = null;
let oscillatorNode = null;
let gainNode = null;

function playNotes(noteString) {
  if (!audioContext && !oscillatorNode && !gainNode) {
    audioContext = new AudioContext();
    oscillatorNode = new OscillatorNode(audioContext, {frequency: 0, type: "sine"});
    gainNode = new GainNode(audioContext);
    oscillatorNode.start();
  }

  oscillatorNode.frequency.cancelScheduledValues(audioContext.currentTime);
  gainNode.gain.cancelScheduledValues(audioContext.currentTime);

  const noteDuration = 0.5;
  const volume = 0.5;

  const playingStartTime = audioContext.currentTime + 0.050;

  noteString.split(" ").map(noteToFrequency).forEach((freq, idx) => {
    const fadeInStart = playingStartTime + idx*noteDuration;
    const fadeInEnd = fadeInStart + 0.01*noteDuration;
    const fadeOutStart = fadeInStart + 0.80*noteDuration;
    const fadeOutEnd = fadeInStart + 0.90*noteDuration;

    oscillatorNode.frequency.setValueAtTime(freq, fadeInStart);

    gainNode.gain.setValueAtTime(0, fadeInStart);
    gainNode.gain.linearRampToValueAtTime(volume, fadeInEnd);
    gainNode.gain.setValueAtTime(volume, fadeOutStart);
    gainNode.gain.linearRampToValueAtTime(0, fadeOutEnd);
  });

  oscillatorNode.connect(gainNode);
  gainNode.connect(audioContext.destination);
}
