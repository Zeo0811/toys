"""Basic smoke tests for the Flask app."""
import pytest


def test_import():
    """Verify app can be imported without errors."""
    import app  # noqa: F401


def test_app_routes():
    """Verify core routes are registered."""
    from app import app as flask_app
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    assert "/" in rules
    assert "/api/download" in rules
    assert "/api/progress/<job_id>" in rules
    assert "/api/file/<job_id>" in rules


def test_format_map():
    """Verify quality options are defined."""
    from app import FORMAT_MAP
    assert "best" in FORMAT_MAP
    assert "1080p" in FORMAT_MAP
    assert "720p" in FORMAT_MAP
    assert "audio" in FORMAT_MAP
