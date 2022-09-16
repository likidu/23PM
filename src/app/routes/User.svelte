<script lang="ts">
  import { replace } from 'svelte-spa-router';

  import Button from '../../ui/components/buttons/Button.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { registerView } from '../../ui/stores';
  import { Priority, RenderState } from '../../ui/enums';

  import { stop } from '../components/Audio.svelte';
  import { IconDiscover, IconInbox, IconPlayer, IconUser } from '../assets/icons';

  import { menu, user } from '../stores/user';
  import { Client, useUserStats } from '../services';
  import { formatSeconds } from '../helper';

  const userStats = useUserStats($user.uid);

  registerView({});

  $menu = [
    { id: 'discover', text: 'Discover', route: '#/', icon: IconDiscover },
    { id: 'inbox', text: 'Inbox', route: '/inbox', icon: IconInbox },
    { id: 'player', text: 'Player', route: '/player', icon: IconPlayer },
    { id: 'user', text: 'User', route: '/user', icon: IconUser },
  ];

  function logout() {
    // Stop current playing episode.
    stop();

    Client.logout();
    replace('/');
  }
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="User" />
      <CardContent>
        {#if $userStats.status === 'loading'}
          <Typography align="center">Loading...</Typography>
        {:else if $userStats.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          {@const time = formatSeconds($userStats.data.totalPlayedSeconds, 'array')}
          {#if $user}
            <div class="user-stats">
              <section class="user-stats-header">
                <div>
                  <h2>{$user.nickname}</h2>
                  <figure>
                    <h2>{time[0]}</h2>
                    <span>hrs</span>
                    <h2>{time[1]}</h2>
                    <span>mins</span>
                    <span>played</span>
                  </figure>
                </div>
                <img src={$user.avatar.picture.smallPicUrl} class="rounded-full w-24 h-24" alt="Avatar" />
              </section>
              <section class="user-stats-numbers">
                <figure>
                  <h2>{$userStats.data.subscriptionCount}</h2>
                  <figcaption>Subscriptions</figcaption>
                </figure>
                <figure>
                  <h2>{$userStats.data.followingCount}</h2>
                  <figcaption>Followings</figcaption>
                </figure>
                <figure>
                  <h2>{$userStats.data.followerCount}</h2>
                  <figcaption>Followers</figcaption>
                </figure>
              </section>
            </div>
          {/if}
        {/if}
      </CardContent>
      <CardFooter>
        <Button
          title="Logout"
          navi={{
            itemId: 'logout',
            onSelect: () => logout(),
          }}
        />
      </CardFooter>
    </Card>
  </ViewContent>
</View>
