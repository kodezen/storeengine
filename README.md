# StoreEngine

![StoreEngine](https://storeengine.pro/wp-content/uploads/2025/03/logo-1.webp)

[![StoreEngine Version](https://img.shields.io/wordpress/plugin/v/storeengine.svg?label=Version&style=flat-square)](https://wordpress.org/plugins/storeengine/)
[![StoreEngine Rating](https://img.shields.io/wordpress/plugin/r/storeengine?label=Rating&style=flat-square)](https://wordpress.org/plugins/storeengine/)
[![StoreEngine Downloads](https://img.shields.io/wordpress/plugin/dt/storeengine?label=Downloads&style=flat-square)](https://wordpress.org/plugins/storeengine/)
[![StoreEngine Active Install](https://img.shields.io/wordpress/plugin/installs/storeengine?style=flat-square)](https://wordpress.org/plugins/storeengine/)
[![WordPress Tested UpTo](https://img.shields.io/wordpress/v/storeengine.svg?label=WordPress&style=flat-square)](https://wordpress.org/plugins/storeengine/)

---

<a href="https://storeengine.pro" rel="noopener" target="_blank">
    <img src="https://ps.w.org/storeengine/assets/banner-1544x500.jpg" alt="StoreEngine">
</a>

<br/>
<br/>

Welcome to the private StoreEngine repository. Access to this repository is restricted and intended for authorized contributors only.

StoreEngine is a powerful WordPress eCommerce plugin to create and manage stores. It offers flexible payments, memberships, and seamless integrations.

We recommend all developers to follow the [StoreEngine development blog](https://storeengine.pro/blog/) to stay up to date about everything happening in the project.

[follow @StoreEngineTeam](https://twitter.com/StoreEngineTeam) on Twitter<br>
[follow @StoreEngine](https://www.facebook.com/storeengine) on FaceBook<br>
[follow @StoreEngine](https://www.linkedin.com/showcase/storeengine/) on LinkedIn<br>
[follow @StoreEngine](https://www.youtube.com/@StoreEngine) on YouTube<br>

## Contributing

This is a private repository intended for authorized contributors only.
If you have access, please follow the steps below to set up your development environment and contribute to StoreEngine.

### Prerequisites

- Use [Node Version Manager (NVM)](https://github.com/nvm-sh/nvm) to manage your Node.js versions efficiently.
- On Linux/macOS, run `nvm use` in the project directory to switch to the Node.js version specified in the `.nvmrc` file.
- On Windows, NVM does not automatically read `.nvmrc`; you must explicitly run `nvm use <version>` to switch Node.js versions.
- Windows users are encouraged to use Git Bash or a similar terminal emulator for a better development experience.
- Composer is recommended for managing PHP dependencies but is not required.
- WP-CLI is recommended for WordPress command line management but is not required.

### 1. Clone the Repository

Clone the StoreEngine repository into your WordPress installation’s `wp-content/plugins` directory:

```shell
git clone git@github.com:storeengine/storeengine.git wp-content/plugins/storeengine
```

### 2. Install Dependencies

Navigate to the cloned directory and install all required dependencies:

```shell
npm install
```

### 3. Build JavaScript Assets

Run the JavaScript compiler (Webpack) to build the JS assets.

```shell
npm start
```

> Note that this command does not launch a development server but compiles the JavaScript files.

### 4. Git Setup (Recommended)

To help manage merge conflicts more smoothly, configure Git to use the "theirs" merge driver for this repository:

```shell
git config merge.theirs.driver true
```

This setting helps automatically resolve conflicts by favoring incoming changes.

### 5. Coding Standards

Please adhere to the WordPress PHP coding standards ([WPCS](https://github.com/WordPress/WordPress-Coding-Standards) & [VIPCS](https://github.com/Automattic/VIP-Coding-Standards)) and JavaScript coding best practices. Consistent code style is important for maintainability and collaboration.

### 6. Submitting Pull Requests

- Fork the repository and create your feature branch.
- Ensure your code passes all tests and linting checks.
- Submit a pull request with a clear description (and changelog entries) of your changes.
- Engage with code review feedback promptly.

Thank you for contributing to StoreEngine!

## Changelog

[Changelog](./changelog.txt).

## License

[GPL-3.0-or-later](./license) &copy; [StoreEngine](https://storeengine.pro)

<p style="text-align: center">
    <br/><br/>
    Made with ❤️ by <a href="https://twitter.com/StoreEngineTeam">StoreEngineTeam</a>.
</p>
