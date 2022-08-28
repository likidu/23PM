<script lang="ts">
  import { onMount } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import { registerView, updateView, view } from '../../ui/stores';
  import { DataStatus } from '../../ui/enums';

  import Button from '../../ui/components/buttons/Button.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import InputRow from '../../ui/components/form/InputRow.svelte';
  import Typography from '../../ui/components/Typography.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';

  import logo from '../assets/svelte.png';
  import { user, mobilePhoneNumber } from '../stores';
  import { AuthClient } from '../services';
  import type { LoginWithSMSError, User } from '../models';

  export let params: { cardId: string };

  let area = '+86';
  let mobile = '13817930979';
  let code = '';
  let toast = '';
  let result: User | LoginWithSMSError;

  registerView({
    cards: [
      {
        id: 'splash',
        title: 'Welcome',
        onSelect: () => replace('/welcome/splash'),
      },
      {
        id: 'sendsms',
        title: 'SMS Code',
        onSelect: () => replace('/welcome/sendsms'),
      },
      {
        id: 'login',
        title: 'Login',
        onSelect: () => {},
      },
    ],
    activeCardId: params.cardId ?? 'splash',
  });

  async function sendSMS() {
    mobilePhoneNumber.set(mobile);

    const isCodeSent = await AuthClient.sendCode({
      mobilePhoneNumber: $mobilePhoneNumber,
      areaCode: area,
    });

    // sendCode returns 200 response
    if (isCodeSent) {
      replace('/welcome/login');
    }
  }

  async function login() {
    result = await AuthClient.loginWithSMS({
      mobilePhoneNumber: $mobilePhoneNumber,
      areaCode: area,
      verifyCode: code,
    });

    if (!(result.hasOwnProperty('success') && result['success'] === false)) {
      // Save to store: user
      $user = result as User;
      replace('/');
    } else {
      toast = (result as LoginWithSMSError).toast;
    }
  }

  onMount(async () => {
    updateView({ dataStatus: DataStatus.Loaded });
  });
</script>

<View>
  <ViewContent>
    {#if params.cardId === $view.cards[0].id}
      <Card cardId={$view.cards[0].id}>
        <CardHeader />
        <CardContent>
          <div class="logo">
            <img src={logo} alt="Svelte Logo" class="inline-box h-48 w-48" />
          </div>
          <Button
            title="Login with SMS"
            navi={{
              itemId: 'start',
              onSelect: async () => replace('/welcome/sendsms'),
            }}
          />
        </CardContent>
      </Card>
    {:else if params.cardId === $view.cards[1].id}
      <Card>
        <CardHeader />
        <CardContent>
          <Typography align="center" padding="both">Enter your mobile phone</Typography>
          <InputRow label="Mobile" value={mobile} placeholder="Mobile number..." onChange={(val) => (mobile = val)} />
          <Button
            title="Send Verification Code"
            navi={{
              itemId: 'sendSMS',
              onSelect: async () => sendSMS(),
            }}
          />
        </CardContent>
      </Card>
    {:else if params.cardId === $view.cards[2].id}
      <Card>
        <CardHeader />
        <CardContent>
          <Typography align="center" padding="both">Enter your verification code</Typography>
          <InputRow label="Verify code" value={code} placeholder="Verify code..." onChange={(val) => (code = val)} />
          <Button
            title="Send Verification Code"
            navi={{
              itemId: 'sendSMS',
              onSelect: async () => login(),
            }}
          />
          {#if result && $user === undefined}
            <p class="text-red-500">{toast}</p>
          {/if}
        </CardContent>
      </Card>
    {/if}
  </ViewContent>
</View>
