import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    {
      postcssPlugin: 'remove-invalid-host-text-size-adjust',
      Rule(rule) {
        if (rule.selector.includes(':host')) {
          rule.walkDecls('-webkit-text-size-adjust', (decl) => {
            decl.remove();
          });
        }
      },
    },
  ],
};