from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import openai
import re

# Create your views here.
def index(request):
	return HttpResponse("I think it's working...!")


# wwww.server.com/namePull/brazil --> 
def phraseCreator(request, country):
  phrase = 'Give me 5 fun facts for ' + country + ' for a guess the country game without mentioning ' + country + ' in the facts'
  messages = [ {"role": "system", "content": "You are a intelligent assistant."} ]

  
  messages.append( 
        {"role": "user", "content": phrase}, 
    ) 
  print('Sending response to GPT')
  chat = openai.ChatCompletion.create( 
        model="gpt-4", messages=messages 
    ) 
  reply = chat.choices[0].message.content 
  line = []
  for _line in reply.split('\n'):
       string = _line.strip()[2:].strip()
       if string != '':
           line.append(string)

  response = JsonResponse(line, safe=False)
  return response
  

openai.api_key = ''


