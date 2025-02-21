<template>
  <h1>View our community trees!</h1>

  <div class="h-4"></div>

  <Button @click="refresh">Refresh</Button>

  <h3>login button is below here</h3>

  <form v-if="!token" @submit.prevent="login" class="login-form">
    <input
      type="text"
      ref="tokenInput"
      placeholder="token"
      style="border-bottom: thick double"
    />
    <p class="inline">(get it by dming STEM.HELP "!token")</p>
    <div class="h-3"></div>
    <Button @click="() => loginUsingToken()"> Login using token </Button>
  </form>

  <h6 v-else>Your id is {{ token.split(`_`)[0] }}</h6>

  <div class="h-5"></div>

  <div class="view">
    <div
      class="card"
      v-for="(user, k) in users"
      :key="k"
      :style="{
        'grid-row': `span ${Math.ceil(
          (260 +
            16 *
              ((user.stdout.match(/\n/g)?.length || 0) +
                (userCodes?.[k]?.source_code?.match(/\n/g)?.length || 0))) /
            240,
        )}`,
      }"
    >
      <div class="namearea w-full">
        <h2 class="text-render" style="display: inline">{{ user.username }}</h2>
        <h5 style="display: inline">#{{ user.discriminator }}</h5>
      </div>
      <h4 class="text-render">{{ user.title }}</h4>
      <code
        class="p-4 bg-gray-800 text-render text-xs"
        style="color: #ffffff; border-radius: 5px; width: 460px"
      >
        <pre class="text-render" style="overflow: hidden; width: 100%">{{
          user?.stdout
        }}</pre>
      </code>
      <h5>Source code {{ userCodes?.[k]?.code_type }}</h5>
      <code
        class="p-4 bg-gray-800 text-render text-xs"
        style="color: #ffffff; border-radius: 5px; width: 460px"
      >
        <pre class="text-render" style="white-space: pre-wrap; width: 100%">{{
          userCodes?.[k]?.source_code
        }}</pre>
      </code>
      <div class="h-5"></div>
      <div class="voting">
        <Button
          class="upvote"
          :active="voteData[k] === 1 ? `activeUp` : ``"
          @click="upvote(k)"
        >
          <i class="fa fa-thumbs-up"></i>
          <p>{{ Object.values(user.votes).filter((v) => v === 1).length }}</p>
        </Button>
        <div class="w-1"></div>
        <Button
          class="downvote"
          @click="downvote(k)"
          :active="voteData[k] === -1 ? `activeDown` : ``"
        >
          <i class="fa fa-thumbs-down"></i>
          <p>{{ Object.values(user.votes).filter((v) => v === -1).length }}</p>
        </Button>
      </div>
    </div>
  </div>
  <div class="h-10"></div>
  <h1>Upload your tree!</h1>

  <div class="form-wrapper" :class="{ submitting: sending }">
    <h5 class="bg-red-500" style="color: grey">{{ errorMessage }}</h5>
    <form @submit.prevent class="form" ref="form">
      <h1 style="opacity: 100%">
        {{ sending ? "Uploading..." : "Submit Here" }}
      </h1>
      <span>
        <input type="text" name="title" required />
        <label for="title">Title</label>
      </span>
      <span>
        <textarea
          required
          name="source_code"
          style="font-family: Consolas, monaco, monospace; width: 100%"
        />
        <label for="source_code">Code</label>
      </span>
      <span>
        <input
          type="text"
          name="code_type"
          required
          style="font-family: Consolas, monaco, monospace"
        />
        <label for="code_type">Language (e.g python)</label>
      </span>
      <span>
        <input
          type="text"
          name="token"
          required
          style="font-family: Consolas, monaco, monospace"
        />
        <label for="token">Your token (get it by dming STEM.HELP !token)</label>
      </span>
      <div class="check flex items-center">
        <input
          type="checkbox"
          name="hide"
          required
          style="
            font-family: Consolas, monaco, monospace;
            height: 20px;
            width: 20px;
          "
        />
        <div class="w-5"></div>
        <div>
          <label for="hide" style="display: inline"
            >Hide output until voting period</label
          >
          <p>(uncheck to let people see your tree)</p>
        </div>
      </div>
      <div class="h-5"></div>
      <Button @click="sendChristmasTree()" style="color: black">Upload!</Button>
    </form>
  </div>
</template>

<script>
import Button from "@/components/Button.vue";
import { ref } from "vue";

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

async function treeData(trees) {
  await Promise.all(
    Object.entries(trees).map(async ([k, v]) => {
      const { discriminator, username } = await fetch(
        `${process.env.VUE_APP_API_URL}/v1/service/discordidlookup/${k}`,
      ).then((r) => r.json());
      v.discriminator = discriminator;
      v.username = username;
    }),
  );
  // shuffle order
  const keys = Object.keys(trees);
  const n = {};
  shuffle(keys).forEach((k) => {
    n[k] = trees[k];
  });

  return n;
}

export default {
  inheritAttrs: false,
  setup() {
    const refresh = ref(async () => {});

    const form = ref(null);

    const loginForm = ref(null);
    const token = ref(null);
    const tokenInput = ref(null);

    const users = ref([]);
    const userCodes = ref([]);
    const errorMessage = ref(undefined);

    const sending = ref(false);

    const voteData = ref({});

    // Post data to server
    function updateVotes() {
      // content
      console.log(token.value);
      fetch(`${process.env.VUE_APP_API_URL}/v1/events/christmastree/vote`, {
        method: `POST`,
        headers: {
          "Content-Type": `application/json`,
        },
        body: JSON.stringify({
          votes: voteData.value,
          token: token.value,
        }),
      }).then(() => {
        refresh.value();
      });
    }

    function upvote(id) {
      if (!this.token) {
        alert(`Please login first!`);
      }
      this.voteData[id] = (this.voteData[id] ?? 0) <= 0 ? 1 : 0;
      updateVotes();
    }
    function downvote(id) {
      if (!this.token) {
        alert(`Please login first!`);
      }
      this.voteData[id] = (this.voteData[id] ?? 0) >= 0 ? -1 : 0;
      updateVotes();
    }

    function loginUsingToken() {
      const inp = this.tokenInput.value;

      if (inp.length < 1) {
        alert(`Please enter a token`);
        return;
      }

      if (!inp.match(/^\d+_\w+$/)) {
        alert(`Please enter a valid token`);
        return;
      }

      this.token = inp;
    }

    async function sendChristmasTree() {
      if (!form.value) return;
      console.log(`sending...`);
      this.sending = true;
      const fd = new FormData(form.value);
      try {
        await fetch(`${process.env.VUE_APP_API_URL}/v1/events/christmastree`, {
          method: `POST`,
          body: fd,
          headers: {
            // adding this doesnt work
            // 'Content-Type': 'multipart/form-data'
          },
        }).then(async (r) => {
          const jbody = await r.json();
          console.log(jbody);
          if (r.status >= 400) {
            console.log(`error`);
            this.errorMessage = jbody.message;
          } else {
            console.log(`success`);
            alert(`your code has been submitted!`);
            await treeData(jbody.trees);
            this.users = jbody.trees;
            this.userCodes = jbody.codes;
          }
        });
      } catch (e) {
        console.log(e);
        if (e.status === 500) {
          this.errorMessage = `internal server error`;
        } else {
          this.errorMessage = e.statusText;
        }
        alert(`something went wrong`);
      } finally {
        this.sending = false;
      }
    }

    return {
      users,
      userCodes,
      voteData,
      upvote,
      downvote,
      sendChristmasTree,
      errorMessage,
      refresh,
      sending,
      form,
      loginForm,
      loginUsingToken,
      token,
      tokenInput,
    };
  },
  created() {
    this.refresh = () =>
      fetch(`${process.env.VUE_APP_API_URL}/v1/events/christmastree`)
        .then((res) => res.json())
        .then(async (data) => {
          await treeData(data.trees);
          this.users = data.trees;
          this.userCodes = data.codes;
        })
        .catch((err) => {
          alert(`error fetching christmas tree data`);
          console.log(err);
        });
    this.refresh();
  },
  mounted() {
    this.form = this.$refs.form;
    this.tokenInput = this.$refs.tokenInput;
  },
  components: {
    Button,
  },
};
</script>

<style lang="scss">
.view {
  display: grid;
  grid-auto-flow: row;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  grid-auto-rows: fit-content(1em);
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 10px solid;
  border-image-slice: 1;
  border-width: 5px;
  border-image-source: linear-gradient(to left, #743ad5, #d53a9d);
  padding: 1rem;
  margin: 0.2rem;
  box-shadow: 0 0 7px #00000041;
}

.voting {
  width: 100%;
  display: flex;
}

// form styles
.form-wrapper {
  width: 100%;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
  form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    padding: 2rem;
    box-shadow: 0 0 7px #00000041;
    width: 36rem;
    margin: 0 auto;
  }
  form {
    background: #00000000;
    h1 {
      font-size: 3rem;
    }
    span {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin: 1rem 0;
      width: 100%;
      input,
      textarea {
        width: 100%;
        padding: 0.8rem;
        background: none;
        border-bottom: solid 2px #613a94a1;
        margin-bottom: 1rem;
      }

      textarea {
        height: 250px;
        resize: none;
      }

      label {
        position: absolute;
        margin-left: 1.2rem;
        transition: all 0.4s ease;
      }
      input:valid ~ label,
      input:focus ~ label {
        font-size: 1.2rem;
        transform: translate(-0.2rem, -3rem);
        color: rgb(116, 116, 116);
      }
      textarea:valid ~ label,
      textarea:focus ~ label {
        font-size: 1.2rem;
        transform: translate(-0.2rem, -150px);
        color: rgb(116, 116, 116);
      }
      input:focus {
        border-bottom: solid 2px var(--main-alpha);
      }
      textarea:focus {
        border-bottom: solid 2px var(--main-alpha);
      }
    }
    button {
      padding: 0.6rem;
      margin: 2.6rem 0 0.2rem 0;
      color: white;
      background-color: var(--main-alpha);
      cursor: pointer;
      transition: all 0.4s ease;
    }
    button:hover {
      box-shadow: 0 0 1rem #00000041;
    }
    h2 {
      display: none;
    }
  }
}
.submitting {
  position: relative;
  h1,
  span,
  input,
  button {
    opacity: 0;
    pointer-events: none;
  }
  h2 {
    display: block !important;
    color: rgb(84, 84, 84);
    position: absolute;
    z-index: 10;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
