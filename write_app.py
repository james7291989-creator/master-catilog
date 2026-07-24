content = """import { useState, useRef, useEffect } from 'react';

const SONGS = [
  {id:1, title:"4", bpm:80, key:"G Major", genre:"Hip Hop", moods:["Raw","Gritty"], hook:"Hard hitter with punchy delivery", file: "4.wav"},
  {id:2, title:"Baby You There_", bpm:90, key:"F Minor", genre:"Emotional", moods:["Intimate","Vulnerable"], hook:"Longing and yearning in a deep voice", file: "Baby You There_.wav"},
  {id:3, title:"Dreams", bpm:73.5, key:"F Minor", genre:"Soul", moods:["Dreamy","Ethereal"], hook:"Childhood nostalgia with a lantern in hand", file: "Dreams.wav"},
  {id:4, title:"East Side Cahokia... young pitbull... no", bpm: