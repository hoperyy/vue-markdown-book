
          <template>
              <div class="hoper-body">

                  <div class="hoper-content">
                      <Mmenu :currentIndex="['2','5','0']"></Mmenu>
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

          import Doc from './../../../docs/blog/前端/无线开发/CSS3速查手册.md';

          export default {
              components: {
                  Mheader,
                  Mfooter,
                  Mmenu,
                  Doc
              }
          };

          </script>
        