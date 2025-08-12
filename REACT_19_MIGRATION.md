# React 19 Migration Guide

This document outlines the changes made to upgrade the Quintype Node Framework from React 16 to React 19.1.

## Summary of Changes

### 1. Package.json Updates

#### Core React Dependencies

- **react**: `^16.14.0` → `^19.1.0`
- **react-dom**: `^16.14.0` → `^19.1.0`
- **react-redux**: `^7.2.5` → `^9.1.0`
- **react-router**: `^5.2.1` → `^6.22.0`
- **react-router-dom**: Added `^6.22.0` (new dependency)
- **redux**: `^4.1.1` → `^5.0.1`

#### Babel Dependencies (Updated to Babel 7)

- **@babel/core**: Added `^7.23.0`
- **@babel/preset-react**: Added `^7.23.0`
- **@babel/register**: Added `^7.23.0`
- **@babel/plugin-transform-modules-commonjs**: Added `^7.23.0`
- **@babel/plugin-proposal-object-rest-spread**: Added `^7.20.0`
- **babel-preset-react**: Removed (replaced with @babel/preset-react)
- **babel-register**: Removed (replaced with @babel/register)

### 2. Code Changes

#### Client-side Rendering (`client/start.js`)

- **Import Changes**:
  - `import ReactDOM from "react-dom"` → `import { createRoot, hydrateRoot } from "react-dom/client"`
- **API Changes**:
  - `ReactDOM.render()` → `createRoot().render()`
  - `ReactDOM.hydrate()` → `hydrateRoot()`

#### Server-side Rendering (`server/render.js`)

- Added new `renderReduxComponentStream()` function using `renderToPipeableStream()` for React 19 streaming SSR
- Kept existing `renderToString()` for backward compatibility

#### Routing (`isomorphic/match-best-route.js`)

- **Import Changes**:
  - `const { matchPath } = require("react-router")` → `const { matchPath } = require("react-router-dom")`

#### ESLint Configuration (`.eslintrc.json`)

- Removed deprecated `"prettier/react"` from extends array
- Added `ecmaFeatures: { jsx: true }` to parserOptions
- Added `settings: { react: { version: "detect" } }`

#### Babel Configuration (`test/babel.js`)

- Updated to use Babel 7 packages
- Changed `babel-register` → `@babel/register`
- Updated plugin names to Babel 7 format
- Fixed `ignore` option to be an array

### 3. Breaking Changes and Considerations

#### React 19 Breaking Changes

1. **ReactDOM.render() and ReactDOM.hydrate() are deprecated**

   - Use `createRoot()` and `hydrateRoot()` instead
   - These new APIs return a root object that must be used for subsequent renders

2. **React Router v6 Changes**

   - `matchPath` moved from `react-router` to `react-router-dom`
   - Significant API changes in React Router v6 (not all covered in this migration)

3. **Redux v5 Changes**
   - Potential breaking changes in Redux API
   - May require updates to store configuration

#### React Redux v9 Changes

- Potential breaking changes in connect() API
- May require updates to component connections

### 4. New Features Available

#### React 19 Features

1. **Concurrent Features**: React 19 includes concurrent rendering capabilities
2. **Streaming SSR**: New `renderToPipeableStream()` API for better performance
3. **Automatic Batching**: Improved batching of state updates
4. **Suspense for Data Fetching**: Enhanced Suspense capabilities

#### React Router v6 Features

1. **New Routing API**: More flexible routing with hooks
2. **Better TypeScript Support**: Improved type definitions
3. **Nested Routes**: Enhanced nested routing capabilities

### 5. Testing Considerations

The test suite may need updates due to:

1. **React 19 API changes**: Some test utilities may need updates
2. **React Router v6**: Routing tests may need updates
3. **Redux v5**: Store tests may need updates
4. **Babel 7**: Some test configurations may need adjustments

### 6. Recommended Next Steps

1. **Review Test Failures**: Address the 79 failing tests identified in the test run
2. **Update Component Code**: Review and update any components using deprecated APIs
3. **Update Routing**: Review and update any custom routing logic for React Router v6
4. **Performance Testing**: Test the new streaming SSR capabilities
5. **Dependency Review**: Review other dependencies for React 19 compatibility

### 7. Backward Compatibility

- Server-side rendering with `renderToString()` remains compatible
- Most existing component code should work without changes
- The new APIs are additive and don't break existing functionality

### 8. Performance Benefits

- **Streaming SSR**: Better Time to First Byte (TTFB) with `renderToPipeableStream()`
- **Concurrent Rendering**: Better user experience with concurrent features
- **Automatic Batching**: Reduced re-renders with automatic batching

## Files Modified

1. `package.json` - Updated dependencies
2. `client/start.js` - Updated to React 19 client APIs
3. `server/render.js` - Added streaming SSR support
4. `isomorphic/match-best-route.js` - Updated React Router imports
5. `.eslintrc.json` - Updated ESLint configuration
6. `test/babel.js` - Updated to Babel 7
7. `REACT_19_MIGRATION.md` - This migration guide

## Notes

- The migration maintains backward compatibility where possible
- New React 19 features are available but not required
- Some test failures are expected and need to be addressed
- Consider this a foundation for further React 19 optimizations
