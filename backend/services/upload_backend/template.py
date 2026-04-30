from langchain.prompts import PromptTemplate

# 📝 Prompt template matching your DB schema
resume_parse_prompt = PromptTemplate(
    input_variables=["resume_text"],
    template="""
You are an expert HR analyst. Given the following resume text, extract these exact fields in valid JSON format.

Resume:
---
{resume_text}
---

Return a JSON object with these keys exactly:
- name: string
- email: string
- mobile_number: string
- years_experience: number (estimate if needed)
- skills: array of strings (key technologies or proficiencies)
- roles: array of strings (previous job titles)
- location: string (city or country if found)

Strictly return valid JSON. Do not include any explanation or extra text.
"""
)

resume_parse_prompt.save("prompt.json")