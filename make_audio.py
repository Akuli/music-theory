import re
import os
import argparse
import wave
from math import pi, sin


def note_to_frequency(name: str) -> float:
    if name == '.':
        return 0  # silence

    m = re.fullmatch('([A-G])([#b]?)(-?\d+)', name)
    if not m:
        raise ValueError(f"bad pitch: {name!r}")

    letter, sharp_or_flat_if_any, octave_number = m.groups()
    shift_from_C0 = 'C D EF G A B'.index(letter) + 12*int(octave_number)
    if sharp_or_flat_if_any == '#':
        shift_from_C0 += 1
    if sharp_or_flat_if_any == 'b':
        shift_from_C0 -= 1

    shift_from_A4 = shift_from_C0 - 9 - 4*12
    return 440 * 2**(shift_from_A4 / 12)


assert note_to_frequency('.') == 0
assert note_to_frequency('A4') == 440
assert note_to_frequency('A3') == 220
assert note_to_frequency('A2') == 110

SAMPLE_RATE = 44100


def sine_wave(freq: float, duration: float, volume: float) -> bytes:
    result = bytearray()

    for sample_num in range(round(duration * SAMPLE_RATE)):
        t = sample_num / SAMPLE_RATE

        # Stop note by fading out to silence slightly before the note ends.
        fadeout_start = 0.80 * duration
        fadeout_duration = 0.10 * duration

        fadeout_progress = (t - fadeout_start) / fadeout_duration
        if fadeout_progress < 0:
            gain = volume
        elif fadeout_progress > 1:
            gain = 0
        else:
            gain = volume * (1 - fadeout_progress)

        sample = gain * sin(2*pi*freq*t)
        sample_bytes = round(sample * 0x7fff).to_bytes(2, byteorder="little", signed=True)
        result.extend(sample_bytes)

    return bytes(result)


def create_wav_file(notes: list[str], note_duration: float, volume: float, wav_path: str) -> None:
    wav_data = b"".join(
        sine_wave(note_to_frequency(note), duration=note_duration, volume=volume)
        for note in notes
    )

    with wave.open(wav_path, 'wb') as file:
        file.setframerate(SAMPLE_RATE)
        file.setnchannels(1)
        file.setsampwidth(2)
        file.writeframes(wav_data)

    return wav_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("notes", help="notes to play, e.g. 'C3 C3 C3 E3'")
    parser.add_argument("--note-duration", help="duration of one note, in seconds", type=float, default=0.5)
    parser.add_argument("--volume", help="how loud, between 0.0 and 1.0", type=float, default=0.5)
    parser.add_argument("-o", "--outfile", help="output file name", default="out.wav")
    args = parser.parse_args()

    assert 0 <= args.volume <= 1
    assert args.note_duration > 0

    create_wav_file(
        notes=args.notes.split(),
        note_duration=args.note_duration,
        volume=args.volume,
        wav_path=args.outfile,
    )
    print(r'\textattachfile[color=0 0 1]{' + args.outfile + r'}{Kuuntele}')


if __name__ == '__main__':
    try:
        main()
    except BrokenPipeError:
        pass  # just happens with latex for some reason?
    except Exception:
        print(r'\errmessage{python error}')
        raise
