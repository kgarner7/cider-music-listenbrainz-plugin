# Cider Libre.fm/ListenBrainz/Maloja Scrobbler

This plugin allows you to scrobble tracks to Libre.fm, ListenBrainz and/or Maloja. 
In addition, if ListenBrainz is configured, you can fetch recommendations and attempt to match them in Cider.

**This plugin is not affiliated with Cider Collective**

## What is scrobbled

A song is scrobbled if you have listened to it a total of `duration * fraction_before_scrobbling`, where `fraction_before_scrobbling` is a ratio between 0 and 80%.
As an example, if you have a track that is 4 minutes, and you set `ListenBrainz Scrobble Delay (%)` to 25, it will scrobble after you have listened for a total of 1 minute.
It does not matter _how_ you listen to it; you can start at the beginning, jump forward, and then jump back.
Notably, if you pause the currently played song, it will **not** be scrobbled.

Like with LastFM, you can toggle whether to show the current track as "Now Playing" (this excludes Maloja), and whether to filter looped tracks.

## Installation
The following assumes that Cider is installed
1. Go to Cider settings
2. Open the "Advanced" tab
3. Click on "Explore GitHub Plugins"
4. Search for "Cider ListenBrainz Scrobbler" and install

## Usage
1. Open Cider > Plugin > Libre.FM, ListenBrainz, Maloja Configuration
2. Configure your connections.
    1. [ListenBrainz](https://listenbrainz.org): get your token from https://listenbrainz.org/profile/ (or click on the link shown). 
    If using a custom URL, please provide the base path, so that it can resolve the API.
    2. [Libre.FM](https://libre.fm): Click connect, and log in. Once authorized, you can either enable it, or wait 60 seconds.
    3. [Maloja](https://github.com/krateng/maloja). Provide any one of your API keys, as well as the base url for your service. This **should not** include paths such as `/apis/listenbrainz`.
3. Enable as many of the services as you wish, and configure other settings in General.

## ListenBrainz Recommendations
If you have configured base ListenBrainz, you can view recommendations in the Recommendations tab.
You can select from raw recommendations, top artists, or similar artists.
This plugin will search for tracks in Apple Music, first by ISRC (if present), and then by release name and artist.

## Development
The main code branch is `main-dev`. If you wish to make changes, you should work on this branch.

### Setup
This project uses yarn to build. 
You should make sure to install this first. 
Then run ```yarn``` to install all of the dependencies (these are only used for development/type checking).
You should also copy `.env.example` to `.env`. 
If you are on Linux, set `FLATPAK` to either `true` if you are using Flatpak. Otherwise, you can leave it as false.

### Building
If you want to test your changes, you should run `yarn start`. 
This will watch for changes, and attempt to copy your files to the correct directory.
For type-checking, you should also run `yarn type-check:watch`.

### Debugging the frontend
To prevent pollution of the global namespace, I've made most of the frontend build as an IIFE. There are some exports in `index.frontend.ts`, which you can access by using the variable `ListenBrainzPlugin` (e.g. `ListenBrainzPlugin.StorageUtil`).

## Language
I have reused as much of Cider's built-in translation as possible, but there are some parts that I have added that are only in English (and some of the services return data in English).