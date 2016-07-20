
"use strict";

(function() {
    angular
    .module("oneaux")
    .controller("AdminPlistController", [
        "PlaylistFactory",
        "SongFactory",
        "$state",
        "$stateParams",
        "Spotify",
        "$http",
        "$sce",
        AdminPlistControllerFunction
    ])

    function AdminPlistControllerFunction (PlaylistFactory, SongFactory, $state, $stateParams, Spotify, $http, $sce) {

        var vm = this;
        PlaylistFactory.get({id: $stateParams.id}).$promise.then(function(response) {
            vm.playlist = response;
            vm.play_song = $sce.trustAsHtml("<iframe src='https://embed.spotify.com/?uri=spotify:user:"+vm.playlist.spotify_user_id+":playlist:"+vm.playlist.spotify_playlist_id+"' width='300' height='380' frameborder='0' allowtransparency='true'></iframe>");
        });
        vm.songs = SongFactory.query({playlist_id: $stateParams.id});
        vm.playlist_counter = 2;

        vm.playlistSort = function () {
            vm.list_of_scores = [];
            for (var i = 0; i < vm.songs.length; i++) {
                if (vm.song[i].active === true) {
                    vm.list_of_scores.push(vm.songs[i].score);
                }
            }
            vm.max_score = Math.max(...vm.list_of_scores);
            vm.next_song = vm.songs.filter(function( obj ) {
                if (obj.active === true) {
                    return obj.score == vm.max_score;
                } 
            })
            if (localStorage.getItem('username') == vm.next_song.user) {
                localStorage.setItem('user-song-count', parseInt(localStorage.getItem('user-song-count')) - 1);
            }
            vm.next_song.active = false;
            vm.next_song.$update({playlist_id: $stateParams.id, id: song.id}).then(function() {
                $http({
                  method: "POST",
                  url: "https://api.spotify.com/v1/users/"+vm.playlist.spotify_user_id+"/playlists/"+vm.playlist.spotify_playlist_id+"/tracks?uris="+vm.next_song[0].uri,
                  headers: {
                      "Accept": "application/json",
                      "Authorization": "Bearer "+vm.playlist.access_token
                  }
                }).then(function successCallback(response) {
                    console.log(response);
                  }, function errorCallback(response) {
                    console.log(response);
                });
            })
        }

        vm.refresh_token = function () {
            Spotify.login();
            vm.access_token = localStorage.getItem('spotify-token');
            vm.playlist.access_token = vm.access_token;
            vm.playlist.$update({id: vm.playlist.id});
        }

        vm.update_score = function (song, net) {
            song.score = parseInt(parseInt(song.score) + parseInt(net));
            song.$update({playlist_id: $stateParams.id, id: song.id});
        }

        vm.remove_song = function (song) {
            song.$delete({playlist_id: vm.playlist.id, id: song.id});
            $state.reload();
        }

    }

})();
