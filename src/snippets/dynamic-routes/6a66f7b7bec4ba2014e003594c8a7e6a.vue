
            <template>
                <div>
                    <Mheader></Mheader>
                    <Snippet></Snippet>
                    <Mfooter></Mfooter>
                </div>
            </template>

            <script>
            import Mheader from '../../components/Header.vue';
            import Mfooter from '../../components/Footer.vue';

            import Snippet from '../../../docs/snippets/JavaScript/33.md';

            export default {
                components: {
                    Mheader,
                    Mfooter,
                    Snippet
                }
            };

            </script>
          