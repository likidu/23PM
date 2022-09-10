<script lang="ts">
  import { onDestroy } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import { KeyManager } from '../../ui/services';
  import { registerView, updateView, view } from '../../ui/stores';
  import { DataStatus, Priority } from '../../ui/enums';

  import Button from '../../ui/components/buttons/Button.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import InputRow from '../../ui/components/form/InputRow.svelte';
  import Typography from '../../ui/components/Typography.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ViewFooter from '../../ui/components/view/ViewFooter.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';

  import logo from '../assets/cosmos.webp';
  import { user } from '../stores/user';
  import { Client } from '../services';
  import type { AuthError, User } from '../models';
  import Console from '../components/Console.svelte';

  export let params: { cardId: string };

  let area = '+1';
  let mobile = '2067711184';
  let code = '';
  let toast = '';

  const keyMan = KeyManager.subscribe(
    {
      onSoftLeft: () => {
        if (params.cardId === 'sms') {
          replace('/welcome/splash');
        } else if (params.cardId === 'login') {
          replace('/welcome/splash');
        }
        return true;
      },
    },
    Priority.High,
  );

  registerView({
    cards: [
      {
        id: 'splash',
        title: 'Welcome',
        onSelect: () => {},
      },
      {
        id: 'sms',
        title: 'SMS Code',
        onSelect: () => {},
      },
      {
        id: 'login',
        title: 'Login',
        onSelect: () => {},
      },
    ],
    activeCardId: params.cardId ?? 'splash',
  });

  function splash() {
    replace('/welcome/sms');
  }

  async function sendSMS() {
    // Reset toast message
    toast = '';

    const result = await Client.sendCode({
      mobilePhoneNumber: mobile,
      areaCode: area,
    });

    // sendCode returns 200 response, and data: {}
    if (Object.keys(result).length === 0) {
      replace('/welcome/login');
    } else {
      toast = (result as AuthError).toast;
    }
  }

  async function login() {
    // Reset toast message
    toast = '';

    const result = await Client.loginWithSMS({
      mobilePhoneNumber: mobile,
      areaCode: area,
      verifyCode: code,
    });

    if (!(result.hasOwnProperty('success') && result['success'] === false)) {
      // Save to store: user
      user.update(result as User);
      replace('/');
    } else {
      toast = (result as AuthError).toast;
    }
  }

  // onMount(async () => {
  //   updateView({ dataStatus: DataStatus.Loaded });
  // });
  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  <ViewContent>
    {#if params.cardId === $view.cards[0].id}
      <Card cardId={$view.cards[0].id}>
        <CardHeader title="CosmosFM" />
        <CardContent>
          <div class="logo">
            <h2>小宇宙 App for KaiOS</h2>
            <img src={logo} alt="Svelte Logo" class="inline-box rounded-full h-48 w-48" />
          </div>
          <Button
            title="Login with SMS"
            navi={{
              itemId: 'splash',
              onSelect: async () => splash(),
            }}
          />
        </CardContent>
      </Card>
    {:else if params.cardId === $view.cards[1].id}
      <Card>
        <CardHeader title="Login" />
        <CardContent>
          <Typography align="center" padding="both">Enter your mobile phone</Typography>
          <InputRow label="Mobile" value={mobile} placeholder="Mobile number..." onChange={(val) => (mobile = val)} />
          <Button
            title="Send Code"
            navi={{
              itemId: 'sms',
              onSelect: async () => sendSMS(),
            }}
          />
          {#if toast !== ''}
            <p class="text-red-500">{toast}</p>
          {/if}
        </CardContent>
        <CardFooter><p>Back</p></CardFooter>
      </Card>
    {:else if params.cardId === $view.cards[2].id}
      <Card>
        <CardHeader title="Login" />
        <CardContent>
          <Typography align="center" padding="both">Enter your verification code</Typography>
          <InputRow label="Verify code" value={code} placeholder="Verify code..." onChange={(val) => (code = val)} />
          <Button
            title="Login"
            navi={{
              itemId: 'login',
              onSelect: async () => login(),
            }}
          />
          {#if toast !== '' && !$user}
            <p class="text-red-500">{toast}</p>
          {/if}
        </CardContent>
        <CardFooter><p>Back</p></CardFooter>
      </Card>
    {/if}
  </ViewContent>
  <ViewFooter><Console /></ViewFooter>
</View>

<style lang="postcss">
  .logo {
    @apply flex flex-col items-center justify-center;
  }
</style>
