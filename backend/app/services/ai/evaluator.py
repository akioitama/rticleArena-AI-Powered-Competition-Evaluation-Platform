import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.competition import Competition

client = genai.Client(api_key=settings.OPENAI_API_KEY)

class EvaluationResult(BaseModel):
    score: float = Field(description="A numerical score from 0 to 100")
    feedback: str = Field(description="Detailed textual feedback on the article")

def generate_evaluation_prompt(article_content: str, competition: Competition) -> str:
    prompt = f"""
You are an expert article evaluator and scorer. 
You are evaluating an article submitted for the competition titled: "{competition.title}".
Competition Description: {competition.description}
Competition Guidelines: {competition.guidelines}

The article content is as follows:
---
{article_content}
---

Please evaluate the article. Your task is to output a single numerical score between 0 and 100, and a concise paragraph of constructive feedback.
"""
    if competition.criteria:
        prompt += "\nUse the following exact scoring criteria and their weights:\n"
        for c in competition.criteria:
            prompt += f"- {c.name} (Weight: {c.weight}): {c.description}\n"
            
    return prompt

def evaluate_article(article_content: str, competition: Competition) -> EvaluationResult:
    prompt = generate_evaluation_prompt(article_content, competition)
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=EvaluationResult,
            temperature=0.2,
        ),
    )
    
    # Parse the guaranteed JSON text returned by the model
    result_dict = json.loads(response.text)
    return EvaluationResult(**result_dict)
