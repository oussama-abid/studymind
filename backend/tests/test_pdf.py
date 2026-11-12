from backend.services.pdf import extract_pages


def test_extract_pages_returns_text_per_page(tmp_path, make_pdf):
    path = tmp_path / "lecture.pdf"
    path.write_bytes(make_pdf(["First page.", "", "Third page."]))

    assert extract_pages(path) == [
        (1, "First page."),
        (2, ""),
        (3, "Third page."),
    ]
