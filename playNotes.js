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

const NUMBER_OF_OSCILLATORS = 10;

function noteSpecToFrequenciesAndVolumes(noteSpec) {
  if (/[0-9]/.test(noteSpec)) {
    // single note, e.g. C5
    return [{frequency: noteToFrequency(noteSpec), volume: 0.6}];
  }
  else {
    // congruence class that refers to multiple notes, e.g. "C"
    const result = [];
    for (let i = 0; i < NUMBER_OF_OSCILLATORS; i++) {
      // "C" --> C0, C1, C2, ...
      const frequency = noteToFrequency(noteSpec + i);

      // Volume is biggest when near 1kHz, and gets smaller as we go further out in gaussian style.
      // Constants must be so that the sum of all waves does not exceed 1, at least not very much.
      const volume = 0.39 * Math.exp(-0.5*Math.pow(Math.log2(frequency / 1000), 2));

      result.push({frequency, volume});
    }

    return result;
  }
}

let audioContext = null;
const oscillatorNodes = Array(NUMBER_OF_OSCILLATORS);
const gainNodes = Array(NUMBER_OF_OSCILLATORS);

function playNotes(noteString) {
  if (!audioContext) {
    audioContext = new AudioContext();
    for (let i = 0; i < NUMBER_OF_OSCILLATORS; i++) {
      oscillatorNodes[i] = new OscillatorNode(audioContext, {frequency: 0, type: "sine"});
      gainNodes[i] = new GainNode(audioContext);

      oscillatorNodes[i].connect(gainNodes[i]);
      gainNodes[i].connect(audioContext.destination);

      gainNodes[i].gain.value = 0;
      oscillatorNodes[i].start();
    }
  }

  // Stop all oscillators
  for (const gain of gainNodes) {
    gain.gain.value = 0;
    gain.gain.cancelScheduledValues(audioContext.currentTime);
  }
  for (const osc of oscillatorNodes) {
    osc.frequency.cancelScheduledValues(audioContext.currentTime);
  }

  const noteDuration = 0.5;
  const playingStartTime = audioContext.currentTime + 0.050;

  noteString.split(" ").forEach((noteSpec, idx) => {
    const fadeInStart = playingStartTime + idx*noteDuration;
    const fadeInEnd = fadeInStart + 0.01*noteDuration;
    const fadeOutStart = fadeInStart + 0.80*noteDuration;
    const fadeOutEnd = fadeInStart + 0.90*noteDuration;

    const freqsAndVols = noteSpecToFrequenciesAndVolumes(noteSpec);

    for (let i = 0; i < NUMBER_OF_OSCILLATORS; i++) {
      const {frequency, volume} = freqsAndVols[i] || {frequency: 0, volume: 0};
      oscillatorNodes[i].frequency.setValueAtTime(frequency, fadeInStart);
      gainNodes[i].gain.setValueAtTime(0, fadeInStart);
      gainNodes[i].gain.linearRampToValueAtTime(volume, fadeInEnd);
      gainNodes[i].gain.setValueAtTime(volume, fadeOutStart);
      gainNodes[i].gain.linearRampToValueAtTime(0, fadeOutEnd);
    }
  });
}
