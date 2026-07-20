import os

from dotenv import load_dotenv
from google import genai


load_dotenv()


client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def ask_dataset_ai(question, dataset):

    prompt = f"""

You are an expert Data Scientist.

Analyze this dataset:

{dataset}


User Question:
{question}


Give a short business-focused answer.

"""


    try:

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )


        return response.text


    except Exception as e:

        print("Chat AI Error:", e)

        return "AI service temporarily unavailable."