export class PolyGuruConfig {
  public mode: string = 'app';
  public appComponentsPathMatcher: string[] = [
    'src/**/*.html'
  ];
  public externalComponentsPathMatcher: string[] = [ 
    'bower_components/**/*.html', 
    '!bower_components/**/test/*.html',
    '!bower_components/**/demo/*.html',
    '!bower_components/app-layout/{templates,patterns,site}/**/*.html'
  ];
  
  constructor() {
  }
}