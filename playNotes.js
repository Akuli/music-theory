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

let audioParams = null;

function playNotes(noteString) {
  if (!audioParams) {
    const audioCtx = new AudioContext();
    const oscillatorNode = new OscillatorNode(audioCtx, {frequency: 0, type: "sine"});
    const gainNode = new GainNode(audioCtx);
    audioParams = {ctx: audioCtx, freq: oscillatorNote.frequency, gain: gainNode.gain};
  }

  oscillator.frequency.cancelScheduledValues(audioParams.ctx.currentTime);
  gain.frequency.cancelScheduledValues(audioParams.ctx.currentTime);

  const noteDuration = 0.5;
  const volume = 0.5;

  const playingStartTime = audioParams.ctx.currentTime + 0.050;

  noteString.split(" ").map(noteToFrequency).forEach((freq, idx) => {
    const noteStart = playingStartTime + idx*noteDuration;
    const fadeoutStartTime = noteStart + 0.80*noteDuration;
    const fadeoutEndTime = noteStart + 0.80*noteDuration;

    oscillator.frequency.setValueAtTime(freq, noteStart);
    gainNode.gain.setValueAtTime(volume, noteStart);
    gainNode.gain.setValueAtTime(volume, noteStart + fadeoutStartTime);
    gainNode.gain.linearRampToValueAtTime(0, noteStart + fadeoutEndTime);

    osc.start(noteStartTime);
    osc.stop(noteStartTime + noteDuration);
  });

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
}
