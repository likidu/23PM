<script lang="ts">
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { Priority, RenderState } from '../../ui/enums';

  const keyMan = KeyManager.subscribe(
    {
      onEnter: () => {
        return true;
      },
      onArrowLeft: () => {
        // Rewind 15s
        return true;
      },
      onArrowLeftLong: () => {
        return true;
      },
      onArrowRight: () => {
        // Wind 30s
        return true;
      },
      onArrowRightLong: () => {
        return true;
      },
      onArrowUp: () => {
        return true;
      },
      onArrowDown: () => {
        return true;
      },
    },
    Priority.High,
  );
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Yes?" />
      <CardContent>
        <Typography align="center">Error!</Typography>
      </CardContent>
    </Card>
  </ViewContent>
</View>
