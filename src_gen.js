const fs = require('fs');

const songData = [
  {id:1, title:"4", bpm:80, key:"G Major", genre:"Hip Hop", moods:["Raw","Gritty"], hook:"Hard hitter with punchy delivery", file: "4.wav"},
  {id:2, title:"Baby You There_", bpm:90, key:"F Minor", genre:"Emotional", moods:["Intimate","Vulnerable"], hook:"Longing and yearning in a deep voice", file: "Baby You There_.wav"},
  {id:3, title:"Dreams", bpm:73.5, key:"F Minor", genre:"Soul", moods:["Dreamy","Ethereal"], hook:"Childhood nostalgia with a lantern in hand", file: "Dreams.wav"},
  {id:4, title:"East Side Cahokia... young pitbull... no", bpm:95, key:"D Minor", genre:"Trap Soul", moods:["Aggressive","Moody"], hook:"Street narratives with raw conviction", file: "East Side Cahokia... young pitbull... no.wav"},
  {id:5, title:"East", bpm:85, key:"C Minor", genre:"Atmospheric", moods:["Dark","Cinematic"], hook:"City life with grit and grace", file: "East.wav"},
  {id:6, title:"how it was", bpm:88, key:"A Minor", genre:"Narrative", moods:["Nostalgic","Reflective"], hook:"Memories of what used to be", file: "how it was.wav"},
  {id:7, title:"I was sixteen,