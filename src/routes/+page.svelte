<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
  
    onMount(() => {
      if (document.cookie.includes('access_token')) {
        goto('/dashboard');
      }
    });
  </script>

  