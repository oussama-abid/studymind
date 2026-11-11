import re


def chunk_text(text: str, max_chars: int = 500) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: list[str] = []
    current = ""  # the chunk we're filling right now
    last_sentence = ""  # the last sentence we added (for the overlap)

    for sentence in sentences:
        if not sentence:
            continue  # skip empty pieces (e.g. an empty page)

        if not current:
            # Case A: the chunk is empty → start it with this sentence
            current = sentence

        elif len(current) + 1 + len(sentence) <= max_chars:
            # Case B: the sentence still fits → add it (+ 1 for the space)
            current = current + " " + sentence

        else:
            # Case C: it doesn't fit → finish this chunk...
            chunks.append(current)

            # ...and start the next one, with overlap if it fits
            with_overlap = last_sentence + " " + sentence
            if len(with_overlap) <= max_chars:
                current = with_overlap
            else:
                current = sentence

        last_sentence = sentence

    # After the loop: save the last chunk, if there is one
    if current:
        chunks.append(current)

    return chunks