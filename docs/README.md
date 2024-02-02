# Generating the demo GIF

1. Install [VHS](https://github.com/charmbracelet/vhs)
2. `yarn install`
3. Set `version` in `package.json` to an actual version number
4. `yarn build`
5. `cd ..`
6. `yarn global add file:$PWD/pathflip`

   This does a global install of the local `pathflip` project.

   We need to do it from another folder because being in the `pathflip` project triggers Yarn 2+ to run, which doesn't support this command.

7. `cd pathflip`
8. `vhs docs/demo.tape`
9. Revert the changed PathPlanner project files
10. Commit the changes to the VHS recording and the generated GIF
