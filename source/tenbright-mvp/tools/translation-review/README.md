# Translation review workbook

Rebuilds `tenbright-translation-review.xlsx` from the app source: every translated phrase (one row per pattern), a real
English example captured from the engine, lessons and app text, where it appears, reviewer notes, and the Spanish,
French, Haitian Creole, Chinese (Taiwan) and Arabic drafts with yellow Status/Correction columns.

```
node tools/translation-review/extract.js > /tmp/rows.json
cp tenbright-translation-review.xlsx /tmp/review_previous.xlsx
python3 tools/translation-review/build.py /tmp/rows.json /tmp/review_previous.xlsx tenbright-translation-review.xlsx
```

The previous workbook is read only for its "where it appears" labels and examples. Rebuilding replaces any review
answers in the file, so once reviewers have started, merge their answers before rebuilding.
