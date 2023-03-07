<template>
    <div :class="{'footer_position': positionStyle, 'footer': 1==1}">
        <div class="breadth">
            <div class="footer_all">
                <div class="left">
                    <img :src="footer_logo" alt="">
                    <p>© {{fullYear}}{{$t('footer.copy')}}</p>
                </div>
                <div class="icon">
                    <a href="https://filswan.medium.com/" target="_block"><img :src="share_img1" alt=""></a>
                    <a href="https://discord.com/invite/KKGhy8ZqzK" target="_block"><img :src="share_img10" alt=""></a>
                    <a href="https://twitter.com/0xfilswan" target="_block"><img :src="share_img2" alt=""></a>
                    <a href="https://github.com/filswan" target="_block"><img :src="share_img3" alt=""></a>
                    <a href="https://t.me/filswan" target="_block"><img :src="share_img9" alt=""></a>
                    <a href="https://www.linkedin.com/company/swan-cloud-inc/" target="_block"><img :src="share_img6" alt=""></a>
                </div>
            </div>
        </div>
        <div id="version">v2.0.10</div>
    </div>
</template>
<script>
export default {
  data () {
    return {
      footer_logo: require('@/assets/images/FILSWAN_logo_01.png'),
      share_img1: require('@/assets/images/landing/f1.png'),
      share_img2: require('@/assets/images/landing/f2.png'),
      share_img3: require('@/assets/images/landing/f3.png'),
      share_img6: require('@/assets/images/landing/f6.png'),
      share_img9: require('@/assets/images/landing/telegram.png'),
      share_img10: require('@/assets/images/landing/discord.png'),
      fullYear: 2023
    }
    },
  props: ['positionStyle'],
  computed: {
    language () {
      return this.$store.getters.language
    }
  },
  methods: {
  },
  mounted () {
    this.fullYear = new Date().getFullYear()
  }
}
</script>
<style  lang="scss" scoped>
.footer {
  position: relative;
  background-color: #101c4f;
  .footer_all {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.35rem 0.64rem;
    max-width: 1320px;
    margin: auto;
    @media screen and (max-width: 600px) {
      padding: 0.35rem 4%;
      flex-wrap: wrap;
    }
    .left {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      @media screen and (max-width: 600px) {
        width: 100%;
      }
      img {
        display: block;
        height: 35px;
        @media screen and (max-width: 600px) {
          height: 25px;
        }
      }
      p {
        display: inline-block;
        font-size: 14px;
        margin: 5px 0 0 0.25rem;
        color: rgba(133, 138, 149, 1);
        white-space: nowrap;
        line-height: 1;
        @media screen and (max-width: 600px) {
          font-size: 12px;
        }
      }
    }
    .language {
      display: flex;
      align-items: center;
      padding: 0 0.15rem;
      .act {
        padding: 0.1rem 0.2rem;
        background: #fff;
        border-radius: 0.05rem;
      }
    }
    .icon {
      display: flex;
      justify-content: start;
      @media screen and (max-width: 600px) {
        width: 100%;
        justify-content: center;
        margin: 10px 0 0;
      }
      img {
        display: block;
        height: 20px;
        margin: 0 10px 0 0;
        @media screen and (max-width: 600px) {
          height: 17px;
          margin: 0 8px;
        }
      }
    }
  }
  #version {
    position: absolute;
    right: 5px;
    bottom: 5px;
    font-size: 12px;
    color: #1a2a6a;
  }
}
.footer_position {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
}
@media screen and (max-width: 768px) {
  .footer {
  }
}
@media screen and (max-width: 600px) {
  .footer {
    .pcShow {
      display: none;
    }
    .mobileShow {
      display: block;
    }
  }
}
</style>
