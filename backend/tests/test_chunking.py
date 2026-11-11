from backend.chunking import chunk_text

TEXT = "Docker runs containers. Images are templates. Volumes keep data."


def test_short_text_is_one_chunk():
    assert chunk_text(TEXT, max_chars=500) == [TEXT]


def test_splits_when_too_long():
    assert chunk_text(TEXT, max_chars=40) == [
        "Docker runs containers.",
        "Images are templates. Volumes keep data.",
    ]


def test_adds_overlap_when_it_fits():
    assert chunk_text(TEXT, max_chars=50) == [
        "Docker runs containers. Images are templates.",
        "Images are templates. Volumes keep data.",
    ]


def test_chunks_respect_the_limit():
    for chunk in chunk_text(TEXT * 10, max_chars=100):
        assert len(chunk) <= 100


def test_long_sentence_becomes_its_own_chunk():
    long_sentence = "x" * 60 + "."

    result = chunk_text("Short. " + long_sentence + " End.", max_chars=40)

    assert result == ["Short.", long_sentence, "End."]


def test_empty_text_returns_no_chunks():
    assert chunk_text("") == []