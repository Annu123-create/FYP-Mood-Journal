import google.generativeai as genai

genai.configure(api_key="AIzaSyDET40q1Or82TwYqseUdbNHl02Hp_9kmxo")

models = genai.list_models()
for m in models:
    print(m.name)
