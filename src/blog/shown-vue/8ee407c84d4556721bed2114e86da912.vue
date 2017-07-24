
          <template>
              <div class="hoper-body">

                  <div class="hoper-content">
                      <Mmenu :currentIndex="['3','3']"></Mmenu>
                      <div class="hoper-doc">
                        <Doc></Doc>
                      </div>
                  </div>

              </div>
          </template>

          <script>
          import Mheader from '../../components/Header.vue';
          import Mfooter from '../../components/Footer.vue';
          import Mmenu from '../components/Menu.vue';

          import Doc from './../../../docs/blog/工具/从输入 URL 到页面加载完成的过程中都发生了什么事情？.md';

          export default {
              components: {
                  Mheader,
                  Mfooter,
                  Mmenu,
                  Doc
              }
          };

          </script>
        