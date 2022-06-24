# Cider ListenBrainz Scrobbler

This plugin allows you to scrobble tracks to ListenBrainz. 
To use it, you must get a [ListenBrainz Token](https://listenbrainz.org/profile/).

**This plugin is not affiliated with Cider Collective**

## What is scrobbled

A song is scrobbled if you have listened to it a total of `duration * fraction_before_scrobbling`, where `fraction_before_scrobbling` is a ratio between 0 and 80%.
As an example, if you have a track that is 4 minutes, and you set `ListenBrainz Scrobble Delay (%)` to 25, it will scrobble after you have listened for a total of 1 minute.
It does not matter _how_ you listen to it; you can start at the beginning, jump forward, and then jump back.
Notably, if you pause the currently played song, it will **not** be scrobbled.

Like with LastFM, you can toggle now playing, filtering looped tracks, and remove featured artists from titles (where available).

## Installation
The following assumes that Cider is installed
1. Go to Cider settings
2. Open the "Advanced" tab
3. Click on "Explore GitHub Plugins"
4. Search for "Cider ListenBrainz Scrobbler" and install

## Usage
1. Open Cider > Plugins > ListenBrainz Configuration
2. Enter your [ListenBrainz Token](https://listenbrainz.org/profile/). Once provided, you should see your username.
3. Enable ListenBrainz, and change any other settings you like.