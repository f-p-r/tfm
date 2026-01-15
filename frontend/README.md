# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Testing (Vitest)

Angular 21 uses [Vitest](https://vitest.dev/) as the default unit test runner.

### Run tests

```bash
npm test
# or
ng test
```

Tests run in watch mode by default. For CI environments or one-off test runs, use:

```bash
ng test --no-watch
```

### Configuration

- **Test builder**: `@angular/build:unit-test` (configured in [angular.json](angular.json))
- **Test environment**: [jsdom](https://github.com/jsdom/jsdom) (fast DOM simulation in Node.js, SSR-safe)
- **Optional config**: [vitest-base.config.ts](vitest-base.config.ts) for advanced Vitest options
- **TypeScript types**: `vitest/globals` (see [tsconfig.spec.json](tsconfig.spec.json))

### Migration from Karma/Jasmine

This project was migrated from Karma/Jasmine to Vitest following the [official Angular migration guide](https://angular.dev/guide/testing/migrating-to-vitest).

**Key changes:**
- Replaced `@angular/build:karma` with `@angular/build:unit-test`
- Removed Karma, Jasmine, and related dependencies
- Upgraded to Vitest 4 and jsdom 27
- Updated `tsconfig.spec.json` to use `vitest/globals` types
- Test syntax remains compatible (Jasmine→Vitest schematic applied)

All tests now run faster in Node.js with jsdom, eliminating the need for a browser.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
