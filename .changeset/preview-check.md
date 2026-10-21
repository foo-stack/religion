---
"create-religion": minor
---

`check preview` runs the spec's outcomes against the preview deployment the host built for the
pull request, as well as locally. It finds the address from the deployments recorded for the
head commit through the host's own tool (`gh` on GitHub), asking before each network read
outside an automated run, stamps the address in the Evidence section, and treats a missing,
unfinished or protected preview as could not check. It never deploys.
