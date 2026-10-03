from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional

try:
    from groq import Groq
except ImportError:
    Groq = None  # type: ignore

logger = logging.getLogger(__name__)


class GroqService:
    """Groq LLM API wrapper."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.temperature = float(os.getenv("GROQ_TEMPERATURE", "0.2"))
        self.max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "1000"))
        self.client = None

        if Groq and self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq client initialized with model %s", self.model)
            except Exception as exc:
                logger.warning("Failed to initialize Groq client: %s", exc)
                self.client = None
        else:
            logger.warning("Groq client not initialized (missing API key or package)")

    def is_available(self) -> bool:
        return self.client is not None

    def generate_completion(self, prompt: str) -> Optional[str]:
        """Generate text completion using Groq."""
        if not self.is_available():
            logger.warning("Groq not available, returning None")
            return None

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            return content
        except Exception as exc:
            logger.error("Error generating Groq completion: %s", exc)
            return None

    def generate_structured_response(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Generate structured JSON response."""
        content = self.generate_completion(prompt)
        if not content:
            return None
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Groq response as JSON: %s", exc)
            return None


# Singleton instance
groq_service = GroqService()
