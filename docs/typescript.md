# Using TypeScript in UI5 Apps

## Table of Contents

- [Brief TypeScript Introduction](#brief-typescript-introduction)
- [The Type Definition Files provided for UI5](#the-type-definition-files-provided-for-ui5)
- [How does TypeScript UI5 Code look? - The Sample App in TypeScript](#how-does-typescript-ui5-code-look---the-sample-app-in-typescript)
- [Writing UI5 Apps in TypeScript](#writing-ui5-apps-in-typescript)
- [Converting UI5 Apps from JavaScript to TypeScript](#converting-ui5-apps-from-javascript-to-typescript)
- [Resources](#resources)

<br>
<br>


## Brief TypeScript Introduction

TypeScript is:
- JavaScript <b>plus types</b>
- Purely used at development time (NOT understood by browsers at runtime, so there must be a build step before running it)
- Developed by Microsoft, but open-source and widely adopted

The basic assignment of a type (here: "number") to a variable looks like this:
```ts
var someNumber: number;
```
But of course there are more language constructs, used for defining structured types, classes, enums and so on. For a real introduction to TypeScript with tutorials and an [online playground](https://www.typescriptlang.org/play?#code/PQKgUABCEIYQbjATgSxgIwDYFNImGIkhAM4D2AttgHICuF62SAXBAHb2NIDcYYoeWBABmtNgGMALijJs8BUROmyIFWpmkAHTAE8AFAA9WHBkwA0EHcc5MAlBADekCEmyTaSNhANRLvAL58Ar5w4pgwJCTyYGERJBAA4q5uTI7OEBAA5snSbJmsJJKoebzpEOKyhUi0UmTEelSRMJnYBUUoefZOGT09kgAWKCQAdNnYbh2ZEAC8qthNLby9gb1lY256XWW9ru6eEABEABLYmJhkFgcQANQQA0OjOZNLPYGBYEA), head over to the language homepage at [www.typescriptlang.org](https://www.typescriptlang.org
). They also offer a handy [5-minutes introduction for JavaScript developers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html).

When developers write TypeScript code, the type information is dispersed in the code. But one can also create separate type definition files for already existing JavaScript libraries. Such files have the extension `*.d.ts` and these are exactly what we are providing for UI5 now. For many other JavaScript libraries such type definition files can be found at [definitelytyped.org](https://definitelytyped.org/). 



## The Type Definition Files provided for UI5

The type definitions will be provided via npm soon. Right now, you can get the latest preview drop from the [packages/ui-form/types](../packages/ui-form/types) directory in this project. There is one *.d.ts file per UI5 library.

IMPORTANT: As we want to enable and promote using modern JavaScript, these *.d.ts files are written in a way that supports loading UI5 module with [ES module syntax](https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Modules) (instead of using the UI5 API `sap.ui.require(...)` or `sap.ui.define(...)`) and defining classes with [ES class syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) (instead of using the UI5 API `SomeClass.extend(...)`)). If you use our `*.d.ts` files, this is how you should write your UI5 apps.


### Limitations

- The type definitions are work in progress with NO COMPATIBILITY GUARANTEES! Changes will happen.
- The string syntax for bindings is not supported yet. This means instead of e.g. `new Button({text: "{myModel>someText}"})` one has to use the object syntax to prevent TypeScript from complaining: `new Button({text: {path: "myModel>someText"}})`
- The types of UI5 API parameter and return values are not always precisely defined. This happens especially for nested structures and the types with which Promises resolve. This is because the type definition files are generated from the regular JSDoc documentation, which not always has complete `@param` definitions, but explains some parts in plaintext instead. When you notice a place where types are not fully defined, please open a GitHub ticket. Fixing it will not only improve the TypeScript experience, but also make our regular API documentation more precise.
- There is no support yet for automatically defining the API of custom controls.



## How does TypeScript UI5 Code look? - The Sample App in TypeScript


### Overview of TypeScript-relevant Parts of the Project:
- The [packages/ui-form/src](../packages/ui-form/src) directory contains the TypeScript implementation of the UI5 app. See the next section for details of a controller implementation inside this directory.
- The [packages/ui-form/types](../packages/ui-form/types) directory contains the UI5 type definitions (the `*.d.ts` files). NOTE: this is not the intended final way of using the type definition files. This has only been done to make the *.d.ts files available within the repository and to bridge the time until they are available on npm.
- The [packages/ui-form/tsconfig.json](../packages/ui-form/tsconfig.json) file defines TypeScript compiler options like the JavaScript target version, the location of the `*.d.ts` files and the source and target directory for the TypeScript compilation. 
- The [packages/ui-form/.babelrc](../packages/ui-form/.babelrc) file controls the build steps (first TypeScript to ES6 ("modern" JavaScript), then the conversion of some ES6 language constructs (module imports, classes) to the UI5 way of resource loading and class definition)  
- The [packages/ui-form/package.json](../packages/ui-form/package.json) file contains the `build:ts`and `watch:ts` scripts for yarn which trigger TypeScript compilation and live serving (used from within yarn scripts inside the [top-level package.json](../package.json) file).


### The Most Important Controller in Detail
Most of the application logic is implemented in the [Registration.controller.ts](../packages/ui-form/src/controller/Registration.controller.ts) file. For a general explanation of this file, please check the [documentation in the main branch of this repository](https://github.com/SAP-samples/ui5-cap-event-app/blob/main/docs/documentation.md#The-Heart-of-the-App-the-Registration-Controller), which describes the JavaScript version of the controller in detail. The logic is the same in TypeScript and most of the code as well - after all TypeScript is a superset of JavaScript which "only" adds type information. So let's look at the differences only:


#### Module Loading

The controller file starts with code not typically seen in UI5 apps: importing modules. But this is not TypeScript-specific at all, it's just the modern JavaScript we want to promote:
```js
import Controller from "sap/ui/core/mvc/Controller";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
...
```
This part is transformed to the well-known `sap.ui.define(...)` or `sap.ui.require(...)` in addition to the TypeScript compilation.


#### Type Definitions

The next section consists of pure TypeScript: the definition of certain structures used within the controller:
```ts
type Person = {
	LastName: string,
	FirstName: string,
	Birthday: string
};
...
```
Not all apps use structures like these. But if they do, defining the types provides all the type safety and code completion goodies which TypeScript is good for.


#### Class Definitions

Then, the controller class is defined, inheriting from `sap.ui.core.mvc.Controller`. This is again just modern JavaScript instead of the UI5-proprietary `Controller.extend(...)`. Also how the member methods like `onInit()` and the private member variables like `oBundle` are defined has nothing to do with TypeScript. The only piece of TypeScript in this section of the controller code is how the private member variables are typed (e.g. `oBundle` is defined to be of type `ResourceBundle`).

```ts
/**
 * @namespace sap.ui.eventregistration.form.controller
 */
export default class RegistrationController extends Controller {

	private oBundle : ResourceBundle;
	private oDataModel : ODataModel;

	public onInit() {
```


#### Controller Implementation Code

Within the actual controller implementation, there is very little TypeScript-specific code!

TypeScript code is found for example after method parameters: they need to be typed explicitly - here `aContexts` is an array of OData V4 contexts:
```ts
public onExistingDataLoaded(aContexts : V4Context[]) {
	...
}
```

Local variables are sometimes implicitly typed via the assigned value (`this.oBundle` has type `ResourceBundle`, so TypeScript knows this is also the type of the local variable `oBundle`):
```ts
const oBundle = this.oBundle;
```
But sometimes the type is specified explicitly, e.g. when there is no immediate assignment to the newly declared variable:
```ts
let prop : PersonProp;
```


In some places there is a typecast using the "`as`" keyword, mostly when calling getters like `getModel()` which returns the superclass `sap.ui.model.Model` (the actual instance may be a `ResourceModel` or an `ODataModel`). Or `byId(...)`, which returns `sap.ui.core.Element`, while the returned element may - depending on the ID - be a `sap.m.Button`:
```ts
this.oDataModel = this.getOwnerComponent().getModel() as ODataModel;
...
(this.byId("submitButton") as Button).setEnabled(true);
```
NOTE: Many typecasts like the first one here will become unnecessary once these getter methods make use of generics (this is work in progress). Then it will be sufficient to specify the type of the left-hand side variable (here: `this.oDataModel`).
<br>
<br>
Actually, that's it!<br>
As of writing, the entire controller implementation is almost pure JavaScript with only a dozen typecasts and a dozen type definitions for variables as TypeScript-specific code! So TypeScript is not a new language on its own, but merely an addition which may come with minimal effort, but lots of benefits.




## Writing UI5 Apps in TypeScript

### Setup

This section will be extended once the final mechanism (type definition files available on npm) is in place. For the time being, e.g. copy this example project and use it as starting point for your own app.


### Code

1. Before writing UI5 application code, learn the fundamentals of TypeScript. The [official webpage of the language contains a "handbook"](https://www.typescriptlang.org/docs/handbook/intro.html) and even a quick [5-minutes introduction for JavaScript developers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) which will help.
2. Then, for an impression how UI5 app code written in TypeScript looks, check out the [section above which walks you through the Registration controller code](#how-does-typescript-ui5-code-look---the-sample-app-in-typescript).
3. Then - code! Import modules and define classes using the ES6 syntax. <b>Write the rest of the code like you would normally do in JavaScript!</b> Whenever you need to do something for TypeScript, an error message will tell you! (this requires one of the many TypeScript-aware code editors like VSCode)

#### Typical TypeScript Errors

These are the errors you will encounter most often - and how to solve them.

When TypeScript cannot find out the type of a variable on its own, specify it:<br><br>
![Error message: "Parameter 'aContexts' implicitly has an 'any' type."](typescript-error.png?raw=true)

Solution:
```ts
public onExistingDataLoaded(aContexts : V4Context[]) {
```


When TypeScript complains about a type missing certain properties, it means that the types do not match. This even happens sometimes when a typecast to a specific subclass is required:

![Error message: "Type 'Model' is missing the following properties from type 'ODataModel': ..."](model-missing-properties.png?raw=true)

Solution:
```ts
const oDataModel : ODataModel = this.getOwnerComponent().getModel() as ODataModel;
```

When you are missing a certain mathod in code completion or you try to call this method and TypeScript complains about the method not existing, it may be needed to cast to the specific type you are using:

![Error message: "Property 'setEnabled' does not exist on type 'UI5Element'.ts"](property-does-not-exist.png?raw=true)

Solution:
```ts
(this.byId("submitButton") as Button).setEnabled(true);
```

Most other errors you will encounter might actually point you to real issues in the code! That's what TypeScript is for.


Now enjoy also the other benefits of TypeScript, like the code completion and inline documentation, e.g. for constructors:


![Code Completion Popup for Control Constructor](code-completion-1.png)

...or for method calls:

![Code Completion Popup for Method Call on Control](code-completion-2.png)


### Check the Code

You can run a TypeScript check of the app from the command line with:
```
yarn verify:ui-form
```
This will run a test compilation of the app and output any TypeScript errors.

You can also lint the TypeScript code with:
```
yarn lint:ui-form
```


### Run the App

As the [regular documentation](../README.md#running-the-project) explains, you can run the app in development ("watch") mode with:
```
yarn start
```
or if you only want to run the ui-form app:
```
yarn start:ui-form
```


### Build

As the [regular documentation](../README.md#building-the-project) explains, you can build the app with:
```
yarn start
```
This includes the TypeScript compilation.


### Debug

In the debugger of browsers, you can step through the original TypeScript code you wrote:

![Screenshot of TypeScript code in browser debugger](debugger.png?raw=true)

This is achieved by generating sourcemaps, which contain the original code and information to which place in that original code the actually executed JavaScript statements belong. At least in Chrome, the TypeScript version of the code is automatically opened when a breakpoint is hit, even when that breakpoint was set in the JavaScript version of a file. If you can't see the TypeScript code, make sure sourcemaps are enabled in the settings of your browser's developer tools.


### Additional considerations

#### Performance

One concern when using TypeScript might be whether runtime performance or code size is affected by using TypeScript instead of JavaScript. The short anwer is: no.<br>

The slightly longer answer is: the browser anyway executes the compiled JavaScript, not TypeScript. And the compilation for the most part just removes the type information, so the compiled code is pretty much the same as when you write JavaScript directly. No size penalty, no additional logic. This is not an exhaustive answer, just a rule of thumb.

For example, as of writing, the Registration controller has 265 lines of code in TypeScript, which are compiled to 226 lines of JavaScript (without minification). The controller written in native JavaScript has 230 lines of code.

The <i>compilation</i> performance should not be a concern because it is barely noticeable in small to medium projects. If it becomes one in huge projects, there are [certain hints](https://github.com/microsoft/TypeScript/wiki/Performance) available how to lower compilation time.

#### Type Checks at Runtime

Remember that TypeScript does NOT ensure type correctness at runtime. Despite all compile-time checks, wrongly typed values can still sneak in at runtime, e.g. from JSON API calls to external systems which return an unexpected structure. Those will then lead to the same kind of issues occurring in regular JavaScript apps. Any runtime type checks you want need to be done by you.



## Converting UI5 Apps from JavaScript to TypeScript

TODO: this section will describe the typical tasks and issues when an existing JavaScript UI5 app is converted to TypeScript.

## Resources

TODO: there has been a preview on TypeScript in a "UI5ers live" web conference. The recording will be linked here, once available.

