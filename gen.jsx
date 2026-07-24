import React from 'react'
const writeArray=(a)=>a.map(l=>l.join())).join('\n')
const lines=[['import { useState, useRef, useEffect } from "react";', null],
['const SONGS = [',null],
['  {id:1, title:"4", bpm:80, key:"G Major", genre:"Hip Hop", moods:["Raw","Gritty"], hook:"Hard hitter with punchy delivery", file: "4.wav"},',null],
['  {id:2, title:"Baby You There_", bpm:90, key:"F Minor", genre:"Emotional", moods:["Intimate","Vulnerable"], hook:"Long
